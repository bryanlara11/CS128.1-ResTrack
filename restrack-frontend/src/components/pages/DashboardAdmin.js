import React from "react";
import styles from "./DashboardAdmin.module.css";

import StatusAdmin from "../dashboard/StatusAdmin";  // NEW ADMIN STATUS
import RecentStudies from "../dashboard/RecentStudies";

function DashboardAdmin() {
  return (
    <div className={styles.dashboard}>
      {/* EXACT SAME STRUCTURE */}
      <div className={styles.statusRow}>
        <StatusAdmin />
      </div>

      <div className={styles.bottomRow}>
        <RecentStudies />
        {/* Your admin panel */}
        <div className={styles.adminPanel}>
          <h3>Admin Controls</h3>
          <div className={styles.actionButtons}>
            <button className={styles.actionBtn}>👥 Manage Users</button>
            <button className={styles.actionBtn}>📋 Review Queue</button>
            <button className={styles.actionBtn}>⚙️ Settings</button>
            <button className={styles.actionBtn}>📊 Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardAdmin;