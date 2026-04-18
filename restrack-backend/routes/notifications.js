const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// GET /api/notifications
// Returns notifications for the authenticated user.
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }

  const limit = Number.parseInt(req.query.limit ?? "10", 10);
  const unreadOnly = String(req.query.unreadOnly ?? "false").toLowerCase() === "true";

  try {
    const result = await pool.query(
      `
      SELECT notification_id, research_id, user_id, message, is_read, date_sent
      FROM notifications
      WHERE user_id = $1
        AND ($2::boolean = false OR is_read = false)
      ORDER BY date_sent DESC
      LIMIT $3
      `,
      [userId, unreadOnly, Number.isFinite(limit) ? limit : 10]
    );

    res.json({ notifications: result.rows });
  } catch (err) {
    console.error("Notifications fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const notificationId = Number.parseInt(req.params.id, 10);

  if (!userId) return res.status(401).json({ error: "Invalid token payload" });
  if (!Number.isFinite(notificationId))
    return res.status(400).json({ error: "Invalid notification id" });

  try {
    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE notification_id = $1 AND user_id = $2
      RETURNING notification_id, research_id, user_id, message, is_read, date_sent
      `,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ notification: result.rows[0] });
  } catch (err) {
    console.error("Notification mark-read error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

