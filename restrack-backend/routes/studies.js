const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

function parseLimit(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
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
        (SELECT status_id FROM statuses WHERE status_name = 'Pending' LIMIT 1),
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

// GET /api/studies/:id
router.get("/:id", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const researchId = Number.parseInt(req.params.id, 10);

  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  if (!Number.isFinite(researchId)) return res.status(400).json({ error: "Invalid study id" });

  try {
    // Ensure user has access to this study (same rules as list)
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

