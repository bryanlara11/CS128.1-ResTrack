import React, { useEffect, useState } from "react";
import styles from "./Status.module.css";
import approvedIcon from "../../assets/Approved.png";
import pendingIcon from "../../assets/Pending.png";
import reviewIcon from "../../assets/Under Review.png";
import revisionIcon from "../../assets/For Revision.png";

function Status() {
  const [counts, setCounts] = useState({
    Approved: 0,
    Pending: 0,
    "Under Review": 0,
    "For Revision": 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/dashboard/researcher/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data?.counts) setCounts(data.counts);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className={styles.grid}>

      <div className={`${styles.card} ${styles.approved}`}>
        <div className={styles.cardContent}>
          <div className={styles.text}>
            <span className={styles.label}>Approved</span>
            <span className={styles.value}>{loading ? "—" : counts.Approved}</span>
          </div>
          <img src={approvedIcon} className={styles.icon} alt="approved" />
        </div>
      </div>

      <div className={`${styles.card} ${styles.pending}`}>
        <div className={styles.cardContent}>
          <div className={styles.text}>
            <span className={styles.label}>Pending</span>
            <span className={styles.value}>{loading ? "—" : counts.Pending}</span>
          </div>
          <img src={pendingIcon} className={styles.icon} alt="pending" />
        </div>
      </div>

      <div className={`${styles.card} ${styles.review}`}>
        <div className={styles.cardContent}>
          <div className={styles.text}>
            <span className={styles.label}>Under Review</span>
            <span className={styles.value}>{loading ? "—" : counts["Under Review"]}</span>
          </div>
          <img src={reviewIcon} className={styles.icon} alt="review" />
        </div>
      </div>

      <div className={`${styles.card} ${styles.revision}`}>
        <div className={styles.cardContent}>
          <div className={styles.text}>
            <span className={styles.label}>For Revision</span>
            <span className={styles.value}>{loading ? "—" : counts["For Revision"]}</span>
          </div>
          <img src={revisionIcon} className={styles.icon} alt="revision" />
        </div>
      </div>

    </div>
  );
}

export default Status;