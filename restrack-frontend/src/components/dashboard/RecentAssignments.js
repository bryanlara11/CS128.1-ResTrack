import React, { useState, useEffect } from "react";
import styles from "./RecentAssignment.module.css";
import { useNavigate } from "react-router-dom";

function RecentAssignments() {
  const navigate = useNavigate();
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecentAssignments = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not logged in");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const res = await fetch("http://localhost:5000/api/studies/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load assignments");

        const studies = Array.isArray(data.studies) ? data.studies.slice(0, 3) : [];
        setStudies(studies);
      } catch (err) {
        console.error("Failed to load recent assignments:", err);
        setError(err.message || "Failed to load assignments");
        setStudies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAssignments();
  }, []);

  const STATUS_CLASS = {
    "Approved":               { color: "#10b981", bg: "#d1fae5" },
    "Pending":                { color: "#f59e0b", bg: "#fef3c7" },
    "For Minor Modification": { color: "#3b82f6", bg: "#dbeafe" },
    "For Major Modification":       { color: "#f97316", bg: "#ffedd5" },
    "Forwarded to Reviewers": { color: "#8b5cf6", bg: "#ede9fe" },
    "Disapproved":            { color: "#ef4444", bg: "#fee2e2" },
  };

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <h3>Recent Assignments</h3>
        <button className={styles.viewAll} onClick={() => navigate('/assignments')}>View all assignments</button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : error ? (
          <p className={styles.empty}>{error}</p>
        ) : studies.length === 0 ? (
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