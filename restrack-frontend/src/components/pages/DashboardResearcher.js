import React from "react";
import styles from "./DashboardResearcher.module.css";

import Notifications from "../dashboard/Notifications";
import Status from "../dashboard/Status";
import RecentStudies from "../dashboard/RecentStudies";

function DashboardResearcher() {
  return (
    <div className={styles.dashboard}>

      <div className={styles.statusRow}>
        <Status />
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.leftColumn}>
          <Notifications />
        </div>

        <div className={styles.rightColumn}>
          <RecentStudies />
        </div>
      </div>

    </div>
  );
}

export default DashboardResearcher;