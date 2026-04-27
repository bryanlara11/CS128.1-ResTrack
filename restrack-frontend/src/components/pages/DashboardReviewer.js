import React from "react";
import styles from "./DashboardResearcher.module.css";

import Status from "../dashboard/Status";
import RecentAssignments from "../dashboard/RecentAssignments";

function DashboardResearcher() {
  return (
    <div className={styles.dashboard}>

      <div className={styles.statusRow}>
        <Status />
      </div>

      <div className={styles.bottomRow}>
          <RecentAssignments />
      </div>

    </div>
  );
}

export default DashboardResearcher;