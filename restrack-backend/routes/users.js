const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || "password123";

async function getUserRole(userId) {
  const result = await pool.query(
    `SELECT r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1 LIMIT 1`,
    [userId]
  );
  return String(result.rows[0]?.role_name || "").trim();
}

async function resolveRoleId(roleName) {
  const name = String(roleName || "").trim();
  if (!name || name === "None") return null;
  const roleRes = await pool.query("SELECT role_id FROM roles WHERE role_name = $1", [name]);
  return roleRes.rows[0]?.role_id ?? null;
}

async function resolveDepartmentId(department) {
  const deptName = String(department || "").trim();
  if (!deptName) return null;

  const deptRes = await pool.query(
    "SELECT department_id FROM department WHERE department_name = $1",
    [deptName]
  );
  if (deptRes.rows.length > 0) return deptRes.rows[0].department_id;

  const insertRes = await pool.query(
    "INSERT INTO department (department_name) VALUES ($1) RETURNING department_id",
    [deptName]
  );
  return insertRes.rows[0].department_id;
}

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

// POST /api/users
// Admin creates a new user account
router.post("/", requireAuth, async (req, res) => {
  const adminId = req.user?.id;
  if (!adminId) return res.status(401).json({ error: "Invalid token payload" });

  const roleName = String(req.user?.role_name || (await getUserRole(adminId))).trim();
  if (roleName !== "Admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { first_name, last_name, email, role_name, department } = req.body;
  const trimmedFirst = String(first_name || "").trim();
  const trimmedLast = String(last_name || "").trim();
  const trimmedEmail = String(email || "").trim().toLowerCase();

  if (!trimmedFirst) return res.status(400).json({ error: "First name is required" });
  if (!trimmedLast) return res.status(400).json({ error: "Last name is required" });
  if (!trimmedEmail) return res.status(400).json({ error: "Email is required" });

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    const existing = await pool.query(
      "SELECT user_id, is_active FROM users WHERE email = $1 LIMIT 1",
      [trimmedEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const roleId = await resolveRoleId(role_name);
    if (!roleId) {
      return res.status(400).json({ error: "A valid role is required" });
    }

    const deptId = await resolveDepartmentId(department);
    const passwordHash = await bcrypt.hash(DEFAULT_USER_PASSWORD, 10);

    const result = await pool.query(
      `
      INSERT INTO users (first_name, last_name, email, password, role_id, department_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING user_id, first_name, last_name, email
      `,
      [trimmedFirst, trimmedLast, trimmedEmail, passwordHash, roleId, deptId]
    );

    const user = result.rows[0];
    res.status(201).json({
      message: `User created successfully. Default password: ${DEFAULT_USER_PASSWORD}`,
      user: {
        id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role_name: role_name || "Researcher",
        department: String(department || "").trim(),
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/users/:id
// Update a user's profile (name, role, department)
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, role_name, department } = req.body;

  try {
    const roleId = await resolveRoleId(role_name);
    const deptId = await resolveDepartmentId(department);

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
