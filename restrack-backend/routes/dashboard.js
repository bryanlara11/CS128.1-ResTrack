const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

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

function mapTrbStatusCounts(status, counts) {
  switch (status) {
    case "Pending":
    case "For Revision":
      counts["Pending Review"] += 1;
      break;
    case "Under Review":
    case "Forwarded to Reviewers":
      counts["Under Review"] += 1;
      break;
    case "Approved":
    case "Disapproved":
      counts["Completed"] += 1;
      break;
    default:
      counts["Pending Review"] += 1;
  }
}

function mapReviewerStatusCounts(status, counts) {
  switch (status) {
    case "Pending":
    case "For Revision":
      counts["Pending Review"] += 1;
      break;
    case "Under Review":
    case "Forwarded to Reviewers":
      counts["Under Review"] += 1;
      break;
    case "Approved":
    case "Disapproved":
      counts["Completed"] += 1;
      break;
    default:
      counts["Pending Review"] += 1;
  }
}

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

// GET /api/dashboard/trb/stats
router.get("/trb/stats", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Invalid token payload" });

  try {
    const roleName = normalizeRole(req.user?.role_name || (await getUserRole(userId)));
    if (roleName !== "TRB") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(st.status_name, 'Pending') IN ('Pending', 'Under Review', 'Forwarded to Reviewers', 'For Revision')) AS assigned,
        COUNT(*) FILTER (WHERE COALESCE(st.status_name, 'Pending') IN ('Pending', 'For Revision')) AS "Pending Review",
        COUNT(*) FILTER (WHERE COALESCE(st.status_name, 'Pending') = 'Under Review') AS "Under Review",
        COUNT(*) FILTER (WHERE COALESCE(st.status_name, 'Pending') = 'Forwarded to Reviewers') AS "Forwarded to Reviewers",
        COUNT(*) FILTER (WHERE COALESCE(st.status_name, 'Pending') IN ('Approved', 'Disapproved')) AS "Completed"
      FROM research_studies rs
      LEFT JOIN statuses st ON st.status_id = rs.current_status_id
      WHERE COALESCE(rs.trb_required, false) = true
      `
    );

    const row = result.rows[0] || {};
    const counts = {
      Assigned: row.assigned ?? 0,
      "Pending Review": row["Pending Review"] ?? 0,
      "Under Review": row["Under Review"] ?? 0,
      "Forwarded to Reviewers": row["Forwarded to Reviewers"] ?? 0,
      Completed: row["Completed"] ?? 0,
    };

    res.json({ counts });
  } catch (err) {
    console.error("Dashboard TRB stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/dashboard/reviewer/stats
router.get("/reviewer/stats", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Invalid token payload" });

  try {
    const roleName = normalizeRole(req.user?.role_name || (await getUserRole(userId)));
    if (roleName !== "Reviewer") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE ra.date_completed IS NULL) AS assigned,
        COUNT(*) FILTER (WHERE ra.date_completed IS NULL AND COALESCE(st.status_name, 'Pending') IN ('Pending', 'For Revision')) AS "Pending Review",
        COUNT(*) FILTER (WHERE ra.date_completed IS NULL AND COALESCE(st.status_name, 'Pending') IN ('Under Review', 'Forwarded to Reviewers')) AS "Under Review",
        COUNT(*) FILTER (WHERE ra.date_completed IS NOT NULL) AS "Completed"
      FROM review_assignment ra
      LEFT JOIN research_studies rs ON rs.research_id = ra.research_id
      LEFT JOIN statuses st ON st.status_id = rs.current_status_id
      WHERE ra.reviewer_id = $1
      `,
      [userId]
    );

    const row = result.rows[0] || {};
    const counts = {
      Assigned: row.assigned ?? 0,
      "Pending Review": row["Pending Review"] ?? 0,
      "Under Review": row["Under Review"] ?? 0,
      Completed: row["Completed"] ?? 0,
    };

    res.json({ counts });
  } catch (err) {
    console.error("Dashboard reviewer stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/dashboard/admin/stats
router.get("/admin/stats", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Invalid token payload" });

  try {
    const roleName = normalizeRole(req.user?.role_name || (await getUserRole(userId)));
    if (roleName !== "Admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const totalStudiesRes = await pool.query("SELECT COUNT(*)::int AS count FROM research_studies");
    const totalUsersRes = await pool.query("SELECT COUNT(*)::int AS count FROM users");
    const pendingReviewsRes = await pool.query(
      "SELECT COUNT(*)::int AS count FROM review_assignment WHERE date_completed IS NULL"
    );
    const approvedRes = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM research_studies rs
      LEFT JOIN statuses st ON st.status_id = rs.current_status_id
      WHERE st.status_name = 'Approved'
      `
    );

    const totalStudies = totalStudiesRes.rows[0]?.count ?? 0;
    const approvedCount = approvedRes.rows[0]?.count ?? 0;
    const approvalRate = totalStudies > 0 ? `${Math.round((approvedCount / totalStudies) * 100)}%` : "0%";

    res.json({
      counts: {
        "Total Studies": totalStudies,
        "Total Users": totalUsersRes.rows[0]?.count ?? 0,
        "Pending Reviews": pendingReviewsRes.rows[0]?.count ?? 0,
        "Approval Rate": approvalRate,
      },
    });
  } catch (err) {
    console.error("Dashboard admin stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

