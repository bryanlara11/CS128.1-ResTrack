import React from "react";
import styles from "./DashboardResearcher.module.css";

import Status from "../dashboard/Status";
import RecentStudies from "../dashboard/RecentStudies";

function DashboardResearcher() {
  return (
    <div className={styles.dashboard}>

      <div className={styles.statusRow}>
        <Status />
      </div>

      <div className={styles.bottomRow}>
          <RecentStudies />
      </div>

    </div>
  );
}

export default DashboardResearcher;