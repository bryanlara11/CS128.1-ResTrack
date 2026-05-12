const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

function parseLimit(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
}

async function getStatusId(statusName) {
  const result = await pool.query(
    "SELECT status_id FROM statuses WHERE status_name = $1 LIMIT 1",
    [statusName]
  );
  if (result.rows.length > 0) return result.rows[0].status_id;
  const insertRes = await pool.query(
    "INSERT INTO statuses (status_name) VALUES ($1) RETURNING status_id",
    [statusName]
  );
  return insertRes.rows[0].status_id;
}

function normalizeTrbTargetStatus(statusName) {
  const status = String(statusName || "").trim();
  if (status === "Forwarded to Reviewers" || status === "Approved" || status === "Pending" || status === "Under Review") {
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
      ORDER BY rs.updated_at DESC, rs.created_at DESC
      ${limit ? "LIMIT $2" : ""}
      `,
      limit ? [userId, limit] : [userId]
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
        trb_required,
        corresponding_author_id,
        current_status_id,
        date_registered,
        created_by
      ) VALUES (
        $1,
        $2,
        $3,
        (SELECT department_id FROM users WHERE user_id = $4),
        true,
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

    res.status(201).json({ studyId: researchId });
  } catch (err) {
    console.error("Study creation error:", err);
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
    const query = `
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
      WHERE ${roleName === "TRB" ? "COALESCE(st.status_name, 'Pending') IN ('Pending', 'Under Review', 'Forwarded to Reviewers')" : "COALESCE(st.status_name, 'Pending') = 'Forwarded to Reviewers'"}
      ORDER BY rs.updated_at DESC, rs.created_at DESC
    `;

    const result = await pool.query(query);

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

  try {
    const studyResult = await pool.query(
      `
      SELECT rs.research_id, COALESCE(st.status_name, 'Pending') AS status_name
      FROM research_studies rs
      LEFT JOIN statuses st ON st.status_id = rs.current_status_id
      WHERE rs.research_id = $1
      LIMIT 1
      `,
      [researchId]
    );

    if (studyResult.rows.length === 0) return res.status(404).json({ error: "Study not found" });
    if (studyResult.rows[0].status_name !== "Forwarded to Reviewers") {
      return res.status(403).json({ error: "This study is not ready for reviewer feedback" });
    }

    const targetStatus = normalizeReviewerTargetStatus(status);
    const targetStatusId = await getStatusId(targetStatus);
    const feedbackStatusId = await getStatusId(String(status).trim());

    let assignmentId;
    const assignmentResult = await pool.query(
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
      await pool.query(
        `UPDATE review_assignment SET assignment_status = 'Completed', date_completed = NOW() WHERE assignment_id = $1`,
        [assignmentId]
      );
    } else {
      const newAssignment = await pool.query(
        `
        INSERT INTO review_assignment (research_id, reviewer_id, assigned_by, date_assigned, assignment_status)
        VALUES ($1, $2, $3, NOW(), 'Completed')
        RETURNING assignment_id
        `,
        [researchId, userId, userId]
      );
      assignmentId = newAssignment.rows[0]?.assignment_id;
    }

    await pool.query(
      `
      INSERT INTO review_feedback (assignment_id, research_id, reviewer_id, feedback_status, remarks)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [assignmentId, researchId, userId, String(status).trim(), remarks || ""]
    );

    await pool.query(
      `
      UPDATE research_studies
      SET current_status_id = $1,
          updated_at = NOW()
      WHERE research_id = $2
      `,
      [targetStatusId, researchId]
    );

    res.json({ success: true, status: targetStatus });
  } catch (err) {
    console.error("Reviewer review error:", err);
    res.status(500).json({ error: "Server error" });
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
          OR ($3 = 'TRB' AND COALESCE(st.status_name, 'Pending') IN ('Pending', 'Under Review', 'Forwarded to Reviewers'))
          OR ($3 = 'Reviewer' AND COALESCE(st.status_name, 'Pending') = 'Forwarded to Reviewers')
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
      dateRegistered: row.date_registered,
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

module.exports = router;

