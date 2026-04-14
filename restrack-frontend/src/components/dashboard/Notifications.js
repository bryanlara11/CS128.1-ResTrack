import React from "react";
import styles from "./Notifications.module.css";

function Notifications() {
  const notifications = [
    { text: "Study approved", type: "approved" },
    { text: "Revision requested", type: "revision" },
    { text: "Pending approval", type: "pending" },
    { text: "Under review", type: "review" },
  ];

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <h3>Notifications</h3>
      </div>

      <div className={styles.list}>
        {notifications.map((notif, index) => (
          <div
            key={index}
            className={`${styles.card} ${styles[notif.type]}`}
          >
            {notif.text}
          </div>
        ))}
        <span className={styles.viewAll}>View All Notifications</span>
      </div>
    </div>
  );
}

export default Notifications;