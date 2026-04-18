import React, { useState, useEffect } from "react";
import styles from "./RecentStudies.module.css";
import { useNavigate } from "react-router-dom";

function RecentStudies() {
  const navigate = useNavigate();
  const [studies, setStudies] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("studies") || "[]");
    setStudies(saved.slice(-3).reverse());
  }, []);

  const STATUS_CLASS = {
    "Under Review": { color: "#374850", bg: "#fef3c7" },
    "Approved":     { color: "#374850", bg: "#d1fae5" },
    "Pending":      { color: "#374850", bg: "#fee2e2" },
    "For Revision": { color: "#374850", bg: "#f3f4f6" },
    "Draft":        { color: "#6b7280", bg: "#f3f4f6" },
  };

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <h3>Recent Studies</h3>
        <button className={styles.viewAll} onClick={() => navigate('/studies')}>View all studies</button>
      </div>

      <div className={styles.list}>
        {studies.length > 0 ? studies.map((study) => (
          <div key={study.id} className={styles.card}>
            <div className={styles.topRow}>
              <h4 className={styles.title}>{study.title}</h4>
              <span className={styles.eye} onClick={() => navigate(`/studies/${study.id}`)}>
                <i className="bi bi-eye"></i>
              </span>
            </div>
            <div className={styles.chips}>
              <span>{study.hru}</span>
              <span className={styles.dot}>•</span>
              <span>{study.department}</span>
            </div>
            <div
              className={styles.status}
              style={{
                color: STATUS_CLASS[study.status]?.color,
                backgroundColor: STATUS_CLASS[study.status]?.bg,
              }}
            >
              {study.status}
            </div>
            <div className={styles.bottomRow}>
              <span>Authors: {study.authorList?.length ?? 0}</span>
              <span>Last Modified: {study.date}</span>
            </div>
          </div>
        )) : <p className={styles.empty}>No recent studies.</p>}
      </div>
    </div>
  );
}

export default RecentStudies;