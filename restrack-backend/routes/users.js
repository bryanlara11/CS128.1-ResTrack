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

// GET /api/users
// Returns all users for the admin manage users page.
router.get("/", requireAuth, async (req, res) => {
  // We can add role checking here, but assuming requireAuth is sufficient for now
  try {
    const result = await pool.query(
      `
      SELECT
        u.user_id as id,
        u.first_name,
        u.last_name,
        u.email,
        COALESCE(r.role_name, 'None') AS role_name,
        COALESCE(d.department_name, '') AS department
      FROM users u
      LEFT JOIN roles r ON r.role_id = u.role_id
      LEFT JOIN department d ON d.department_id = u.department_id
      WHERE u.is_active = TRUE
      ORDER BY u.date_created DESC
      `
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/users/:id
// Update a user's profile (name, role, department)
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, role_name, department } = req.body;

  try {
    // get role id
    let roleId = null;
    if (role_name && role_name !== 'None') {
      const roleRes = await pool.query("SELECT role_id FROM roles WHERE role_name = $1", [role_name]);
      if (roleRes.rows.length > 0) roleId = roleRes.rows[0].role_id;
    }

    // get department id
    let deptId = null;
    if (department && department.trim() !== '') {
      const deptName = department.trim();
      const deptRes = await pool.query("SELECT department_id FROM department WHERE department_name = $1", [deptName]);
      if (deptRes.rows.length > 0) {
        deptId = deptRes.rows[0].department_id;
      } else {
        const insertRes = await pool.query(
          "INSERT INTO department (department_name) VALUES ($1) RETURNING department_id",
          [deptName]
        );
        deptId = insertRes.rows[0].department_id;
      }
    }

    await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, role_id = $3, department_id = $4 
       WHERE user_id = $5`,
      [first_name, last_name, roleId, deptId, id]
    );

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/users/:id
// Soft deletes a user (sets is_active to false)
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE users SET is_active = FALSE WHERE user_id = $1 RETURNING user_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
