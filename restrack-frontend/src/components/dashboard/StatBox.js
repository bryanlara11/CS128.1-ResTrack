import React from "react";
import styles from "./StatBox.module.css";

function StatBox() {
  return (
    <div className={styles.box}>
      <h3 className={styles.title}>Statistics</h3>

      <div className={styles.grid}>
        <div className={styles.item}>
          <span className={styles.label}>Approved</span>
          <span className={styles.value}>120</span>
        </div>

        <div className={styles.item}>
          <span className={styles.label}>Pending</span>
          <span className={styles.value}>45</span>
        </div>

        <div className={styles.item}>
          <span className={styles.label}>Under Review</span>
          <span className={styles.value}>18</span>
        </div>

        <div className={styles.item}>
          <span className={styles.label}>For Revision</span>
          <span className={styles.value}>9</span>
        </div>
      </div>
    </div>
  );
}

export default StatBox;