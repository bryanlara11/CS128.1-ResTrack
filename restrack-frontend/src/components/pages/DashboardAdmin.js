import React from "react";
import styles from "./DashboardAdmin.module.css";

import StatusAdmin from "../dashboard/StatusAdmin";  
import RecentStudies from "../dashboard/RecentStudies";

function DashboardAdmin() {
  return (
    <div className={styles.dashboard}>
      {/* EXACT SAME STRUCTURE */}
      <div className={styles.statusRow}>
        <StatusAdmin />
      </div>

      <div className={styles.bottomRow}>
        <RecentStudies showEye={false} showStatus={false} viewAllPath="/admin/review-queue" />
      </div>
    </div>
  );
}

export default DashboardAdmin;