import React from "react";
import styles from "./Status.module.css";
import approvedIcon from "../../assets/Approved.png";
import pendingIcon from "../../assets/Pending.png";
import reviewIcon from "../../assets/Under Review.png";
import revisionIcon from "../../assets/For Revision.png";

function Status() {
  return (
    <div className={styles.grid}>

      {/* APPROVED */}
      <div className={`${styles.card} ${styles.approved}`}>
        <div className={styles.cardContent}>
          <div className={styles.text}>
            <span className={styles.label}>Approved</span>
            <span className={styles.value}>12</span>
          </div>
          <img src={approvedIcon} className={styles.icon} alt="approved" />
        </div>
      </div>

      {/* PENDING */}
      <div className={`${styles.card} ${styles.pending}`}>
        <div className={styles.cardContent}>
          <div className={styles.text}>
            <span className={styles.label}>Pending</span>
            <span className={styles.value}>5</span>
          </div>
          <img src={pendingIcon} className={styles.icon} alt="pending" />
        </div>
      </div>

      {/* UNDER REVIEW */}
      <div className={`${styles.card} ${styles.review}`}>
        <div className={styles.cardContent}>
          <div className={styles.text}>
            <span className={styles.label}>Under Review</span>
            <span className={styles.value}>3</span>
          </div>
          <img src={reviewIcon} className={styles.icon} alt="review" />
        </div>
      </div>

      {/* FOR REVISION */}
      <div className={`${styles.card} ${styles.revision}`}>
        <div className={styles.cardContent}>
          <div className={styles.text}>
            <span className={styles.label}>For Revision</span>
            <span className={styles.value}>2</span>
          </div>
          <img src={revisionIcon} className={styles.icon} alt="revision" />
        </div>
      </div>

    </div>
  );
}

export default Status;