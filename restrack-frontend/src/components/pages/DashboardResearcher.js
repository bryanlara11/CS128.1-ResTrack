import React from "react";
import styles from "./DashboardResearcher.module.css";

import StatBox from "../dashboard/StatBox";
import Notifications from "../dashboard/Notifications";
import Status from "../dashboard/Status";
import RecentStudies from "../dashboard/RecentStudies";

function DashboardResearcher() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.columns}>
        <div className={styles.leftColumn}>
          <StatBox />
          <Notifications />
        </div>

        <div className={styles.rightColumn}>
          <Status />
          <RecentStudies />
        </div>
      </div>
    </div>
  );
}

export default DashboardResearcher;