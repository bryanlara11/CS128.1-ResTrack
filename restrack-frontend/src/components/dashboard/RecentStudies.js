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
      authors: 3,
      date: "Jan 2026",
    },
    {
      id: 2,
      title: "STUDY 2",
      hru: "HRU-2026-002",
      department: "Oncology",
      status: "Approved",
      authors: 2,
      date: "Jan 2026",
    },
  ];

  const STATUS_CLASS = {
  "Under Review": { color: "#374850", bg: "#fef3c7" },
  "Approved":     { color: "#374850", bg: "#d1fae5" },
  "Pending":     { color: "#374850", bg: "#fee2e2" },
  "For Revision": { color: "#374850", bg: "#f3f4f6" },
};

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <h3>Recent Studies</h3>
          <button className={styles.viewAll} onClick={() => navigate('/studies')}>View all studies</button>
      </div>

      <div className={styles.list}>

        {studies.map((study) => (

          <div key={study.id} className={styles.card}>

            <div className={styles.topRow}>
              <h4 className={styles.title}>{study.title}</h4>

              <span
                className={styles.eye}
                onClick={() => navigate(`/study/${study.id}`)}>
                <i class="bi bi-eye"></i>
              </span>
            </div>

            <div className={styles.meta}>
              <span>{study.hru}</span>
              <span className={styles.dot}>•</span>
              <span>{study.department}</span>
            </div>

            <div className={styles.status} 
            style={{ 
              color: STATUS_CLASS[study.status]?.color,
              backgroundColor: STATUS_CLASS[study.status]?.bg,
            }}
>
  {study.status}
</div>

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