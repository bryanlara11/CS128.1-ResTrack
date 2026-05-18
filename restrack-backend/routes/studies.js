const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

function parseLimit(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
}

async function createNotification(researchId, userId, message, client = pool) {
  await client.query(
    `INSERT INTO notifications (research_id, user_id, message, is_read, date_sent) VALUES ($1, $2, $3, false, NOW())`,
    [researchId, userId, message]
  );
}

async function notifyAdmins(researchId, message, client = pool) {
  const admins = await client.query(`SELECT user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'Admin'`);
  for (const admin of admins.rows) {
    await createNotification(researchId, admin.user_id, message, client);
  }
}

async function notifyResearcher(researchId, message, client = pool) {
  const study = await client.query(`SELECT created_by FROM research_studies WHERE research_id = $1`, [researchId]);
  if (study.rows.length > 0) {
    await createNotification(researchId, study.rows[0].created_by, message, client);
  }
}

async function getStatusId(statusName, client = pool) {
  const result = await client.query(
    "SELECT status_id FROM statuses WHERE status_name = $1 LIMIT 1",
    [statusName]
  );
  if (result.rows.length > 0) return result.rows[0].status_id;
  const insertRes = await client.query(
    "INSERT INTO statuses (status_name) VALUES ($1) RETURNING status_id",
    [statusName]
  );
  return insertRes.rows[0].status_id;
}

async function getReviewFeedbackTextColumn(client = pool) {
  const result = await client.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'review_feedback'
      AND column_name IN ('remarks', 'review')
    ORDER BY CASE column_name WHEN 'remarks' THEN 1 WHEN 'review' THEN 2 END
    LIMIT 1
    `
  );

  const columnName = result.rows[0]?.column_name;
  if (!columnName) {
    throw new Error("review_feedback text column is missing");
  }
  return columnName;
}

function normalizeTrbTargetStatus(statusName) {
  const status = String(statusName || "").trim();
  if (
    status === "Forwarded to Reviewers" ||
    status === "Approved" ||
    status === "TRB Approved" ||
    status === "TRB Approved with Final Paper" ||
    status === "Pending" ||
    status === "Under Review"
  ) {
    return "Forwarded to Reviewers";
  }
  if (status === "For Minor Modification" || status === "For Major Modification") {
    return "For Revision";
  }
  if (status === "Disapproved") {
    return "Disapproved";
  }
  return "Pending";
}

function normalizeReviewerTargetStatus(statusName) {
  const status = String(statusName || "").trim();
  if (status === "Approved") return "Approved";
  if (status === "For Minor Modification" || status === "For Major Modification") return "For Revision";
  if (status === "Disapproved") return "Disapproved";
  return "Pending";
}

async function getUserRole(userId) {
  const result = await pool.query(
    `SELECT r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1 LIMIT 1`,
    [userId]
  );
  return String(result.rows[0]?.role_name || "").trim();
}

function normalizeRole(roleName) {
  return String(roleName || "").trim();
}

// GET /api/studies/my?limit=3
router.get("/my", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Invalid token payload" });

  const limit = parseLimit(req.query.limit, null);

  try {
    const roleName = normalizeRole(req.user?.role_name || await getUserRole(userId));
    const result = await pool.query(
      `
      SELECT DISTINCT
        rs.research_id,
        rs.hru_reg_no,
        rs.title,
        rs.abstract_summary,
        COALESCE(d.department_name, '') AS department_name,
        COALESCE(st.status_name, 'Pending') AS status_name,
        rs.created_at,
        rs.updated_at,
        rs.date_registered,
        (
          SELECT COUNT(*)::int
          FROM research_authors ra
          WHERE ra.research_id = rs.research_id
        ) AS author_count
      FROM research_studies rs
      LEFT JOIN department d ON d.department_id = rs.department_id
      LEFT JOIN statuses st ON st.status_id = rs.current_status_id
      LEFT JOIN research_authors ra ON ra.research_id = rs.research_id
      WHERE rs.created_by = $1
         OR rs.corresponding_author_id = $1
         OR ra.user_id = $1
         OR $2 = 'Admin'
      ORDER BY rs.updated_at DESC, rs.created_at DESC
      ${limit ? "LIMIT $3" : ""}
      `,
      limit ? [userId, roleName, limit] : [userId, roleName]
    );

    const studies = result.rows.map((row) => ({
      id: row.research_id,
      hru: row.hru_reg_no || "",
      title: row.title || "",
      abstract: row.abstract_summary || "",
      department: row.department_name || "",
      status: row.status_name || "Pending",
      authorCount: row.author_count ?? 0,
      dateCreated: row.created_at,
      dateModified: row.updated_at,
      dateRegistered: row.date_registered,
    }));

    res.json({ studies });
  } catch (err) {
    console.error("Studies fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/studies
router.post("/", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { title, abstract, authorIds } = req.body;

  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  if (!title || !title.trim()) return res.status(400).json({ error: "Title is required" });
  if (!abstract || !abstract.trim()) return res.status(400).json({ error: "Abstract is required" });

  const parsedAuthorIds = Array.isArray(authorIds)
    ? authorIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
    : [];

  const uniqueAuthorIds = [...new Set([userId, ...parsedAuthorIds])];

  try {
    const pendingStatusId = await getStatusId("Pending");
    const insertRes = await pool.query(
      `
      INSERT INTO research_studies (
        hru_reg_no,
        title,
        abstract_summary,
        department_id,
        corresponding_author_id,
        current_status_id,
        date_registered,
        created_by
      ) VALUES (
        $1,
        $2,
        $3,
        (SELECT department_id FROM users WHERE user_id = $4),
        $4,
        $5,
        NOW(),
        $4
      ) RETURNING research_id
      `,
      [
        `HRU-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)
          .toString()
          .padStart(5, "0")}`,
        title.trim(),
        abstract.trim(),
        userId,
        pendingStatusId,
      ]
    );

    const researchId = insertRes.rows[0]?.research_id;
    if (!researchId) {
      return res.status(500).json({ error: "Failed to create study" });
    }

    if (uniqueAuthorIds.length > 0) {
      await pool.query(
        `
        INSERT INTO research_authors (research_id, user_id, author_type)
        SELECT $1, u.user_id, 'Author'
        FROM (
          SELECT DISTINCT unnest AS user_id
          FROM unnest($2::int[])
        ) u
        JOIN users ON users.user_id = u.user_id
        `,
        [researchId, uniqueAuthorIds]
      );
    }

    const documentMeta = Array.isArray(req.body.documents)
      ? req.body.documents.map((doc) => ({
          name: String(doc.name || "").trim(),
          type: String(doc.fileType || "").trim(),
        })).filter((doc) => doc.name)
      : [];

    if (documentMeta.length > 0) {
      const values = [];
      const placeholders = documentMeta.map((doc, idx) => {
        const base = idx * 5;
        const sanitizedPath = `uploaded/${Date.now()}_${doc.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
        values.push(researchId, userId, doc.name, doc.type, sanitizedPath);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
      });

      await pool.query(
        `INSERT INTO research_documents (research_id, uploaded_by, file_name, file_type, file_path) VALUES ${placeholders.join(", ")}`,
        values
      );
    }

    await notifyAdmins(researchId, `A new study (${title}) has been submitted and is pending review.`);

    res.status(201).json({ studyId: researchId });
  } catch (err) {
    console.error("Study creation error:", err);
    console.error(err.stack);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/studies/:id
router.put("/:id", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const researchId = Number.parseInt(req.params.id, 10);
  const { title, abstract, authorIds, documents } = req.body;

  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  if (!Number.isFinite(researchId)) return res.status(400).json({ error: "Invalid study id" });
  if (!title || !title.trim()) return res.status(400).json({ error: "Title is required" });
  if (!abstract || !abstract.trim()) return res.status(400).json({ error: "Abstract is required" });

  try {
    const access = await pool.query(
      `
      SELECT 1
      FROM research_studies rs
      LEFT JOIN research_authors ra ON ra.research_id = rs.research_id AND ra.user_id = $2
      WHERE rs.research_id = $1
        AND (rs.created_by = $2 OR rs.corresponding_author_id = $2 OR ra.user_id = $2)
      LIMIT 1
      `,
      [researchId, userId]
    );

    if (access.rows.length === 0) return res.status(404).json({ error: "Study not found" });

    await pool.query(
      `
      UPDATE research_studies
      SET title = $1,
          abstract_summary = $2,
          updated_at = NOW()
      WHERE research_id = $3
      `,
      [title.trim(), abstract.trim(), researchId]
    );

    if (Array.isArray(authorIds)) {
      const parsedAuthorIds = authorIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
      const uniqueAuthorIds = [...new Set(parsedAuthorIds)];

      if (uniqueAuthorIds.length > 0) {
        await pool.query("DELETE FROM research_authors WHERE research_id = $1", [researchId]);
        await pool.query(
          `
          INSERT INTO research_authors (research_id, user_id, author_type)
          SELECT $1, u.user_id, 'Author'
          FROM (
            SELECT DISTINCT unnest AS user_id
            FROM unnest($2::int[])
          ) u
          JOIN users ON users.user_id = u.user_id
          `,
          [researchId, uniqueAuthorIds]
        );
      }
    }

    const documentMeta = Array.isArray(documents)
      ? documents.map((doc) => ({
          name: String(doc.name || "").trim(),
          type: String(doc.fileType || "").trim(),
        })).filter((doc) => doc.name)
      : [];

    if (documentMeta.length > 0) {
      const values = [];
      const placeholders = documentMeta.map((doc, idx) => {
        const base = idx * 5;
        const sanitizedPath = `uploaded/${Date.now()}_${doc.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
        values.push(researchId, userId, doc.name, doc.type, sanitizedPath);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
      });

      await pool.query(
        `INSERT INTO research_documents (research_id, uploaded_by, file_name, file_type, file_path) VALUES ${placeholders.join(", ")}`,
        values
      );
    }

    res.json({ studyId: researchId });
  } catch (err) {
    console.error("Study update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/studies/assignments
router.get("/assignments", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  const roleName = normalizeRole(req.user?.role_name || await getUserRole(userId));

  if (roleName !== "TRB" && roleName !== "Reviewer") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    let query = "";
    let params = [];
    if (roleName === "TRB") {
      query = `
        SELECT DISTINCT
          rs.research_id,
          rs.hru_reg_no,
          rs.title,
          rs.abstract_summary,
          COALESCE(d.department_name, '') AS department_name,
          COALESCE(st.status_name, 'Pending') AS status_name,
          rs.created_at,
          rs.updated_at,
          rs.date_registered
        FROM research_studies rs
        LEFT JOIN department d ON d.department_id = rs.department_id
        LEFT JOIN statuses st ON st.status_id = rs.current_status_id
        JOIN (
          SELECT DISTINCT ON (research_id)
            research_id,
            trb_user_id,
            trb_status
          FROM trb_reviews
          WHERE trb_user_id = $1
          ORDER BY research_id, review_date DESC, trb_review_id DESC
        ) tr ON tr.research_id = rs.research_id
        WHERE tr.trb_user_id = $1
          AND tr.trb_status NOT IN ('TRB Approved', 'TRB Approved with Final Paper', 'Disapproved')
          AND COALESCE(st.status_name, 'Pending') IN ('Pending', 'Under Review', 'For Revision')
        ORDER BY rs.updated_at DESC, rs.created_at DESC
      `;
      params = [userId];
    } else {
      query = `
        SELECT DISTINCT
          rs.research_id,
          rs.hru_reg_no,
          rs.title,
          rs.abstract_summary,
          COALESCE(d.department_name, '') AS department_name,
          COALESCE(st.status_name, 'Pending') AS status_name,
          rs.created_at,
          rs.updated_at,
          rs.date_registered
        FROM research_studies rs
        LEFT JOIN department d ON d.department_id = rs.department_id
        LEFT JOIN statuses st ON st.status_id = rs.current_status_id
        JOIN review_assignment ra ON ra.research_id = rs.research_id
        JOIN LATERAL (
          SELECT trb_status
          FROM trb_reviews
          WHERE research_id = rs.research_id
          ORDER BY review_date DESC, trb_review_id DESC
          LIMIT 1
        ) tr ON TRUE
        WHERE ra.reviewer_id = $1
          AND ra.date_completed IS NULL
          AND COALESCE(st.status_name, 'Pending') IN ('Forwarded to Reviewers', 'Under Review')
          AND tr.trb_status NOT IN ('Assigned', 'Pending', 'For Revision', 'Disapproved')
        ORDER BY rs.updated_at DESC, rs.created_at DESC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);

    const studies = result.rows.map((row) => ({
      id: row.research_id,
      hru: row.hru_reg_no || "",
      title: row.title || "",
      abstract: row.abstract_summary || "",
      department: row.department_name || "",
      status: row.status_name || "Pending",
      dateCreated: row.created_at,
      dateModified: row.updated_at,
      dateRegistered: row.date_registered,
    }));

    res.json({ studies });
  } catch (err) {
    console.error("Assignments fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/studies/:id/trb-review
router.post("/:id/trb-review", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  const roleName = normalizeRole(req.user?.role_name || await getUserRole(userId));
  const researchId = Number.parseInt(req.params.id, 10);
  const { status, remarks } = req.body;

  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  if (roleName !== "TRB") return res.status(403).json({ error: "Forbidden" });
  if (!Number.isFinite(researchId)) return res.status(400).json({ error: "Invalid study id" });
  if (!status || !String(status).trim()) return res.status(400).json({ error: "Status is required" });

  try {
    const studyResult = await pool.query(
      `SELECT rs.research_id FROM research_studies rs WHERE rs.research_id = $1 LIMIT 1`,
      [researchId]
    );
    if (studyResult.rows.length === 0) return res.status(404).json({ error: "Study not found" });

    const targetStatus = normalizeTrbTargetStatus(status);
    const targetStatusId = await getStatusId(targetStatus);
    const trbStatusId = await getStatusId(String(status).trim());

    await pool.query(
      `
      UPDATE research_studies
      SET current_status_id = $1,
          updated_at = NOW()
      WHERE research_id = $2
      `,
      [targetStatusId, researchId]
    );

    await pool.query(
      `
      INSERT INTO trb_reviews (research_id, trb_user_id, trb_status, remarks)
      VALUES ($1, $2, $3, $4)
      `,
      [researchId, userId, String(status).trim(), remarks || ""]
    );

    await notifyResearcher(researchId, `TRB Chair left feedback on your study. Target Status: ${targetStatus}`);

    res.json({ success: true, status: targetStatus });
  } catch (err) {
    console.error("TRB review error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/studies/:id/reviewer-review
router.post("/:id/reviewer-review", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  const roleName = normalizeRole(req.user?.role_name || await getUserRole(userId));
  const researchId = Number.parseInt(req.params.id, 10);
  const { status, remarks } = req.body;

  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  if (roleName !== "Reviewer") return res.status(403).json({ error: "Forbidden" });
  if (!Number.isFinite(researchId)) return res.status(400).json({ error: "Invalid study id" });
  if (!status || !String(status).trim()) return res.status(400).json({ error: "Status is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const studyResult = await client.query(
      `
      SELECT rs.research_id, COALESCE(st.status_name, 'Pending') AS status_name
      FROM research_studies rs
      LEFT JOIN statuses st ON st.status_id = rs.current_status_id
      WHERE rs.research_id = $1
      LIMIT 1
      `,
      [researchId]
    );

    if (studyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Study not found" });
    }
    if (!["Forwarded to Reviewers", "Under Review"].includes(studyResult.rows[0].status_name)) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "This study is not ready for reviewer feedback" });
    }

    const targetStatus = normalizeReviewerTargetStatus(status);
    const targetStatusId = await getStatusId(targetStatus, client);
    const feedbackTextColumn = await getReviewFeedbackTextColumn(client);

    let assignmentId;
    const assignmentResult = await client.query(
      `
      SELECT assignment_id
      FROM review_assignment
      WHERE research_id = $1 AND reviewer_id = $2
      LIMIT 1
      `,
      [researchId, userId]
    );

    if (assignmentResult.rows.length > 0) {
      assignmentId = assignmentResult.rows[0].assignment_id;
      await client.query(
        `UPDATE review_assignment SET assignment_status = 'Completed', date_completed = NOW() WHERE assignment_id = $1`,
        [assignmentId]
      );
    } else {
      const newAssignment = await client.query(
        `
        INSERT INTO review_assignment (research_id, reviewer_id, assigned_by, date_assigned, assignment_status)
        VALUES ($1, $2, $3, NOW(), 'Completed')
        RETURNING assignment_id
        `,
        [researchId, userId, userId]
      );
      assignmentId = newAssignment.rows[0]?.assignment_id;
    }

    await client.query(
      `
      INSERT INTO review_feedback (assignment_id, research_id, reviewer_id, feedback_status, ${feedbackTextColumn})
      VALUES ($1, $2, $3, $4, $5)
      `,
      [assignmentId, researchId, userId, String(status).trim(), remarks || ""]
    );

    await client.query(
      `
      UPDATE research_studies
      SET current_status_id = $1,
          updated_at = NOW()
      WHERE research_id = $2
      `,
      [targetStatusId, researchId]
    );

    await notifyResearcher(researchId, `A Reviewer left feedback on your study. Target Status: ${targetStatus}`, client);

    await client.query("COMMIT");
    res.json({ success: true, status: targetStatus });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Reviewer review error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// GET /api/studies/:id
router.get("/:id", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  const roleName = normalizeRole(req.user?.role_name || await getUserRole(userId));
  const researchId = Number.parseInt(req.params.id, 10);

  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  if (!Number.isFinite(researchId)) return res.status(400).json({ error: "Invalid study id" });

  try {
    // Ensure user has access to this study (same rules as list plus TRB/reviewer workflow access)
    const access = await pool.query(
      `
      SELECT 1
      FROM research_studies rs
      LEFT JOIN research_authors ra ON ra.research_id = rs.research_id AND ra.user_id = $2
      LEFT JOIN statuses st ON st.status_id = rs.current_status_id
      WHERE rs.research_id = $1
        AND (
          rs.created_by = $2
          OR rs.corresponding_author_id = $2
          OR ra.user_id = $2
          OR $3 = 'Admin'
          OR ($3 = 'TRB' AND COALESCE(st.status_name, 'Pending') IN ('Pending', 'Under Review', 'Forwarded to Reviewers'))
          OR ($3 = 'Reviewer' AND COALESCE(st.status_name, 'Pending') IN ('Forwarded to Reviewers', 'Under Review') AND EXISTS (
            SELECT 1
            FROM review_assignment ra2
            WHERE ra2.research_id = rs.research_id
              AND ra2.reviewer_id = $2
              AND ra2.date_completed IS NULL
          ) AND EXISTS (
            SELECT 1
            FROM (
              SELECT trb_status
              FROM trb_reviews tr2
              WHERE tr2.research_id = rs.research_id
              ORDER BY tr2.review_date DESC, tr2.trb_review_id DESC
              LIMIT 1
            ) latest_trb
            WHERE latest_trb.trb_status NOT IN ('Assigned', 'Pending', 'For Revision', 'Disapproved')
          ))
        )
      LIMIT 1
      `,
      [researchId, userId, roleName]
    );
    if (access.rows.length === 0) return res.status(404).json({ error: "Study not found" });

    const studyRes = await pool.query(
      `
      SELECT
        rs.research_id,
        rs.hru_reg_no,
        rs.title,
        rs.abstract_summary,
        COALESCE(d.department_name, '') AS department_name,
        COALESCE(st.status_name, 'Pending') AS status_name,
        rs.created_at,
        rs.updated_at,
        rs.date_registered,
        u.first_name AS submitted_first_name,
        u.last_name AS submitted_last_name,
        u.email AS submitted_email
      FROM research_studies rs
      LEFT JOIN department d ON d.department_id = rs.department_id
      LEFT JOIN statuses st ON st.status_id = rs.current_status_id
      LEFT JOIN users u ON u.user_id = rs.created_by
      WHERE rs.research_id = $1
      `,
      [researchId]
    );

    const authorsRes = await pool.query(
      `
      SELECT
        au.user_id,
        au.first_name,
        au.last_name,
        au.email,
        COALESCE(dep.department_name, '') AS department_name
      FROM research_authors ra
      JOIN users au ON au.user_id = ra.user_id
      LEFT JOIN department dep ON dep.department_id = au.department_id
      WHERE ra.research_id = $1
      ORDER BY ra.research_author_id ASC
      `,
      [researchId]
    );

    const docsRes = await pool.query(
      `
      SELECT file_name, upload_date, file_type, file_path
      FROM research_documents
      WHERE research_id = $1
      ORDER BY file_id ASC
      `,
      [researchId]
    );

    const trbRes = await pool.query(
      `SELECT trb_user_id, trb_status
       FROM trb_reviews
       WHERE research_id = $1
       ORDER BY review_date DESC, trb_review_id DESC
       LIMIT 1`,
      [researchId]
    );
    const revRes = await pool.query(`SELECT reviewer_id, review_deadline FROM review_assignment WHERE research_id = $1 ORDER BY assignment_id ASC`, [researchId]);
    
    let deadlineStr = "";
    if (revRes.rows.length > 0 && revRes.rows[0].review_deadline) {
      deadlineStr = new Date(revRes.rows[0].review_deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }

    let feedbackCol;
    try {
      feedbackCol = await getReviewFeedbackTextColumn(pool);
    } catch {
      feedbackCol = 'remarks';
    }

    const trbReviewsRes = await pool.query(`
      SELECT
        tr.trb_status as status,
        tr.remarks as feedback,
        tr.review_date as date,
        u.first_name,
        u.last_name
      FROM trb_reviews tr
      JOIN users u ON u.user_id = tr.trb_user_id
      WHERE tr.research_id = $1 AND tr.trb_status NOT IN ('Assigned', 'Pending')
    `, [researchId]);

    const revFeedbackRes = await pool.query(`
      SELECT
        rf.feedback_status as status,
        rf.${feedbackCol} as feedback,
        rf.feedback_date as date,
        u.first_name,
        u.last_name
      FROM review_feedback rf
      JOIN users u ON u.user_id = rf.reviewer_id
      WHERE rf.research_id = $1
    `, [researchId]);

    const formatName = (f, l) => `${f || ''} ${l || ''}`.trim() || 'Unknown';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    const mapFrontendStatus = (s) => {
      const lower = String(s || "").toLowerCase();
      if (lower.includes("approved")) return "Approved";
      if (lower.includes("disapproved") || lower.includes("rejected")) return "Rejected";
      if (lower.includes("modification") || lower.includes("revision")) return "For Revision";
      return "Pending";
    };

    const reviews = [];
    for (const r of trbReviewsRes.rows) {
      reviews.push({
        reviewer: `${formatName(r.first_name, r.last_name)} (TRB Chair)`,
        status: mapFrontendStatus(r.status),
        feedback: r.feedback,
        date: formatDate(r.date),
        timestamp: r.date ? new Date(r.date).getTime() : 0
      });
    }
    for (const r of revFeedbackRes.rows) {
      reviews.push({
        reviewer: `${formatName(r.first_name, r.last_name)} (Reviewer)`,
        status: mapFrontendStatus(r.status),
        feedback: r.feedback,
        date: formatDate(r.date),
        timestamp: r.date ? new Date(r.date).getTime() : 0
      });
    }
    reviews.sort((a, b) => b.timestamp - a.timestamp);

    const row = studyRes.rows[0];
    const study = {
      documents: docsRes.rows.map((doc) => ({
        name: doc.file_name || "",
        uploadedAt: doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : "",
        fileType: doc.file_type || "",
        path: doc.file_path || "",
      })),
      id: row.research_id,
      hru: row.hru_reg_no || "",
      title: row.title || "",
      abstract: row.abstract_summary || "",
      department: row.department_name || "",
      status: row.status_name || "Pending",
      dateCreated: row.created_at,
      dateModified: row.updated_at,
      dateOfRegistration: row.date_registered ? new Date(row.date_registered).toISOString().split('T')[0] : "",
      hraAlignment: "Not specified",
      assignedTRB: trbRes.rows[0]?.trb_status === 'Assigned' ? trbRes.rows[0]?.trb_user_id : "",
      assignedReviewers: {
        reviewer1: revRes.rows[0]?.reviewer_id || "",
        reviewer2: revRes.rows[1]?.reviewer_id || "",
        plagiarism: revRes.rows[2]?.reviewer_id || "",
      },
      deadline: deadlineStr,
      reviews: reviews,
      history: [], // Would fetch actual history
      bioinformatics: null,
      submittedBy:
        row.submitted_first_name || row.submitted_last_name
          ? `${row.submitted_first_name ?? ""} ${row.submitted_last_name ?? ""}`.trim()
          : row.submitted_email || "—",
      authorList: authorsRes.rows.map((a) => ({
        id: a.user_id,
        name: `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || a.email,
        email: a.email,
        department: a.department_name || "",
      })),
    };

    res.json({ study });
  } catch (err) {
    console.error("Study fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/studies/:id/admin-update
router.put("/:id/admin-update", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  const roleName = normalizeRole(req.user?.role_name || await getUserRole(userId));
  if (roleName !== "Admin") return res.status(403).json({ error: "Forbidden" });

  const researchId = Number.parseInt(req.params.id, 10);
  const { hru, dateOfRegistration, hraAlignment, assignedTRB, assignedReviewers, deadline } = req.body;

  try {
    if (hru !== undefined || dateOfRegistration !== undefined) {
      await pool.query(
        `UPDATE research_studies SET hru_reg_no = COALESCE($1, hru_reg_no), date_registered = COALESCE($2, date_registered) WHERE research_id = $3`,
        [hru || null, dateOfRegistration || null, researchId]
      );
    }

    if (assignedTRB) {
      const trbCheck = await pool.query(
        `SELECT trb_status FROM trb_reviews WHERE research_id = $1 ORDER BY review_date DESC, trb_review_id DESC LIMIT 1`,
        [researchId]
      );
      const latestStatus = trbCheck.rows[0]?.trb_status;
      if (latestStatus !== 'Assigned') {
        await pool.query(
          `INSERT INTO trb_reviews (research_id, trb_user_id, trb_status) VALUES ($1, $2, 'Assigned')`,
          [researchId, assignedTRB]
        );
        await createNotification(researchId, assignedTRB, "A new study has been assigned to you for review.");
      }
    }

    if (assignedReviewers) {
      await pool.query(`DELETE FROM review_assignment WHERE research_id = $1`, [researchId]);
      const dlDate = deadline ? new Date(deadline) : null;
      for (const key of ['reviewer1', 'reviewer2', 'plagiarism']) {
        if (assignedReviewers[key]) {
          await pool.query(
            `INSERT INTO review_assignment (research_id, reviewer_id, assigned_by, review_deadline) VALUES ($1, $2, $3, $4)`,
            [researchId, assignedReviewers[key], userId, dlDate]
          );
          await createNotification(researchId, assignedReviewers[key], "A new study has been assigned to you for review.");
        }
      }
    }

    // Determine target status
    const studyState = await pool.query(`
      SELECT
        rs.current_status_id,
        COALESCE(st.status_name, 'Pending') as status_name,
        (SELECT COUNT(*) FROM trb_reviews WHERE research_id = $1 AND trb_status IN ('Assigned', 'Pending')) as pending_trb
      FROM research_studies rs
      LEFT JOIN statuses st ON st.status_id = rs.current_status_id
      WHERE rs.research_id = $1
    `, [researchId]);

    if (studyState.rows.length > 0) {
      const { status_name, pending_trb } = studyState.rows[0];
      let newStatus = status_name;
      
      if (assignedTRB && Number(pending_trb) > 0 && status_name === 'Pending') {
        newStatus = 'Under Review';
      } else if (assignedReviewers && Number(pending_trb) === 0 && (status_name === 'Pending' || status_name === 'Under Review')) {
        newStatus = 'Forwarded to Reviewers';
      }
      
      if (newStatus !== status_name) {
        const statusId = await getStatusId(newStatus);
        await pool.query(`UPDATE research_studies SET current_status_id = $1 WHERE research_id = $2`, [statusId, researchId]);
        await notifyResearcher(researchId, `Your study status has been changed to ${newStatus}.`);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Admin update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
