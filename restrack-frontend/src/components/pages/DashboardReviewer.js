import React from "react";
import styles from "./DashboardResearcher.module.css";

import StatusReviewer from "../dashboard/StatusReviewer";
import RecentAssignments from "../dashboard/RecentAssignments";

function DashboardResearcher() {
  return (
    <div className={styles.dashboard}>

      <div className={styles.statusRow}>
        <StatusReviewer />
      </div>

      <div className={styles.bottomRow}>
          <RecentAssignments />
      </div>

    </div>
  );
}

export default DashboardResearcher;