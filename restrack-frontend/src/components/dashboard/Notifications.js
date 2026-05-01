import React, { useEffect, useMemo, useState } from "react";
import styles from "./Notifications.module.css";

function Notifications() {
  const [notifications, setNotifications] = useState([
  { notification_id: 1, message: "Your study HRU-2026-001 has been sent for review." },
  { notification_id: 2, message: "Dr. Santos left feedback on your study." },
  { notification_id: 3, message: "Your study has been approved." },
  { notification_id: 4, message: "A revision has been requested for your study." },
]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);

  const getTypeFromMessage = (message) => {
    const m = String(message || "").toLowerCase();
    if (m.includes("approved")) return "approved";
    if (m.includes("revision")) return "revision";
    if (m.includes("pending")) return "pending";
    if (m.includes("review")) return "review";
    return "review";
  };

  const fetchNotifications = async () => {
    if (!token) {
      setLoading(false);
      setNotifications([]);
      setError("Not logged in");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/notifications?limit=6", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load notifications");
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (e) {
      setError(e?.message || "Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (notificationId) => {
    if (!token) return;
    try {
      await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch {
    }
  };

  const clearAll = async () => {
  if (!token) return;
  try {
    await fetch("http://localhost:5000/api/notifications/clear", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications([]);
  } catch {
  }
};

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <h3>Notifications</h3>
        {notifications.length > 0 && (
          <button className={styles.clearBtn} onClick={clearAll}>
            Clear all</button>
        )}
      </div>

      <div className={styles.list}>
        {loading && <div className={styles.card}>Loading…</div>}
        {!loading && error && <div className={styles.card}>{error}</div>}
        {!loading && !error && notifications.length === 0 && (
          <div className={styles.card}>No notifications</div>
        )}

        {!loading &&
          !error &&
          notifications.map((notif) => (
          <div
            key={notif.notification_id}
            className={`${styles.card} ${styles[getTypeFromMessage(notif.message)]}`}
            onClick={() => markRead(notif.notification_id)}
            role="button"
            tabIndex={0}
          >
            {notif.message}
          </div>
        ))}
        <span className={styles.viewAll}>View All Notifications</span>
      </div>
    </div>
  );
}

export default Notifications;