import React from "react";
import styles from "./DashboardReviewer.module.css";

import StatusReviewer from "../dashboard/StatusReviewer";
import RecentAssignments from "../dashboard/RecentAssignments";

function DashboardReviewer() {
  return (
    <div className={styles.dashboard}>

      <div className={styles.statusRow}>
        <StatusReviewer />
      </div>

      <div className={styles.bottomRow}>
          <RecentAssignments viewAllPath="/assignments" />
      </div>

    </div>
  );
}

export default DashboardReviewer;