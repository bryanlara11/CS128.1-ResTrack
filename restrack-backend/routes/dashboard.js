const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// GET /api/dashboard/researcher/stats
router.get("/researcher/stats", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Invalid token payload" });

  try {
    const result = await pool.query(
      `
      WITH my_studies AS (
        SELECT DISTINCT rs.research_id, rs.current_status_id
        FROM research_studies rs
        LEFT JOIN research_authors ra ON ra.research_id = rs.research_id
        WHERE rs.created_by = $1
           OR rs.corresponding_author_id = $1
           OR ra.user_id = $1
      )
      SELECT COALESCE(st.status_name, 'Pending') AS status, COUNT(*)::int AS count
      FROM my_studies ms
      LEFT JOIN statuses st ON st.status_id = ms.current_status_id
      GROUP BY COALESCE(st.status_name, 'Pending')
      `,
      [userId]
    );

    const counts = {
      Approved: 0,
      Pending: 0,
      "Under Review": 0,
      "For Revision": 0,
    };

    for (const row of result.rows) {
      if (row.status in counts) counts[row.status] = row.count;
    }

    res.json({ counts });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

