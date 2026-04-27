import React, { useState, useEffect } from "react";
import styles from "./RecentAssignment.module.css";
import { useNavigate } from "react-router-dom";

function RecentAssignments() {
  const navigate = useNavigate();
  const [studies, setStudies] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("studies") || "[]");
    const submitted = saved.filter((s) => s.status !== "Draft");
    setStudies(submitted.slice(-3).reverse());
  }, []);

  const STATUS_CLASS = {
    "Approved":               { color: "#10b981", bg: "#d1fae5" },
    "Pending":                { color: "#f59e0b", bg: "#fef3c7" },
    "For Minor Modification": { color: "#3b82f6", bg: "#dbeafe" },
    "For Modification":       { color: "#f97316", bg: "#ffedd5" },
    "Disapproved":            { color: "#ef4444", bg: "#fee2e2" },
  };

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <h3>Recent Assignments</h3>
        <button className={styles.viewAll} onClick={() => navigate('/assignments')}>View all assignments</button>
      </div>

      <div className={styles.list}>
        {studies.length === 0 ? (
          <p className={styles.empty}>No recent assignments.</p>
        ) : (
          studies.map((study) => (
            <div key={study.id} className={styles.card}>
              <div className={styles.topRow}>
                <h4 className={styles.title}>{study.title}</h4>
                <span className={styles.eye} onClick={() => navigate(`/assignments/${study.id}`)}>
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
          ))
        )}
      </div>
    </div>
  );
}

export default RecentAssignments;