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

    const row = studyRes.rows[0];
    const study = {
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

