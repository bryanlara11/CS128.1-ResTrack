import React from "react";
import styles from "./DashboardReviewer.module.css";

import StatusTRB from "../dashboard/StatusTRB";
import RecentAssignments from "../dashboard/RecentAssignments";

function DashboardTRB() {
  return (
    <div className={styles.dashboard}>

      <div className={styles.statusRow}>
        <StatusTRB />
      </div>

      <div className={styles.bottomRow}>
          <RecentAssignments />
      </div>

    </div>
  );
}

export default DashboardTRB;