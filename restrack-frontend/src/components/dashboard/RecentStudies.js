import React from "react";
import styles from "./RecentStudies.module.css";
import { useNavigate } from "react-router-dom";

function RecentStudies() {
  const navigate = useNavigate();

  const studies = [
    {
      id: 1,
      title: "STUDY 1",
      hru: "HRU-2026-001",
      department: "Cardiology",
      status: "Under Review",
      statusClass: "underReview",
      authors: 3,
      date: "Jan 2026",
    },
    {
      id: 2,
      title: "STUDY 2",
      hru: "HRU-2026-002",
      department: "Oncology",
      status: "Approved",
      statusClass: "approved",
      authors: 2,
      date: "Jan 2026",
    },
  ];

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <h3>Recent Studies</h3>
        <span className={styles.viewAll}>View all studies</span>
      </div>

      <div className={styles.list}>

        {studies.map((study) => (

          <div key={study.id} className={styles.card}>

            {/* TOP ROW */}
            <div className={styles.topRow}>
              <h4 className={styles.title}>{study.title}</h4>

              <span
                className={styles.eye}
                onClick={() => navigate(`/study/${study.id}`)}
              >
                👁
              </span>
            </div>

            <div className={styles.meta}>
              <span>{study.hru}</span>
              <span className={styles.dot}>•</span>
              <span>{study.department}</span>
            </div>

            {/* STATUS */}
            <div className={`${styles.status} ${styles[study.statusClass]}`}>
              {study.status}
            </div>

            {/* BOTTOM ROW */}
            <div className={styles.bottomRow}>
              <span>Authors: {study.authors}</span>
              <span>Last Modified: {study.date}</span>
            </div>

          </div>

        ))}

      </div>
    </div>
  );
}

export default RecentStudies;