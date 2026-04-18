const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// GET /api/users/me
// Returns the authenticated user's basic profile (for autofill).
router.get("/me", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Invalid token payload" });

  try {
    const result = await pool.query(
      `
      SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        COALESCE(d.department_name, '') AS department
      FROM users u
      LEFT JOIN department d ON d.department_id = u.department_id
      WHERE u.user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    const r = result.rows[0];
    if (!r) return res.status(404).json({ error: "User not found" });

    res.json({
      user: {
        id: r.user_id,
        name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.email,
        email: r.email,
        department: r.department,
      },
    });
  } catch (err) {
    console.error("User me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users/search?q=...
// Returns basic user info for autocomplete in author fields.
router.get("/search", requireAuth, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 2) return res.json({ users: [] });

  try {
    const result = await pool.query(
      `
      SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        COALESCE(d.department_name, '') AS department
      FROM users u
      LEFT JOIN department d ON d.department_id = u.department_id
      WHERE
        u.email ILIKE $1
        OR (u.first_name || ' ' || u.last_name) ILIKE $1
        OR u.first_name ILIKE $1
        OR u.last_name ILIKE $1
      ORDER BY u.last_name NULLS LAST, u.first_name NULLS LAST
      LIMIT 8
      `,
      [`%${q}%`]
    );

    res.json({
      users: result.rows.map((r) => ({
        id: r.user_id,
        name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.email,
        email: r.email,
        department: r.department,
      })),
    });
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

