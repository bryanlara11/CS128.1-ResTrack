import React, { useState, useEffect } from "react";
import styles from "./RecentStudies.module.css";
import { useNavigate } from "react-router-dom";

function RecentStudies() {
  const navigate = useNavigate();
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setError("Not logged in");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("http://localhost:5000/api/studies/my?limit=3", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load studies");
        setStudies(Array.isArray(data.studies) ? data.studies : []);
      } catch (e) {
        setError(e?.message || "Failed to load studies");
        setStudies([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const STATUS_CLASS = {
  "Approved":               { color: "#10b981", bg: "#d1fae5" },
  "Pending":                { color: "#f59e0b", bg: "#fef3c7" },
  "For Minor Modification": { color: "#3b82f6", bg: "#dbeafe" },
  "For Major Modification":       { color: "#f97316", bg: "#ffedd5" },
  "Disapproved":            { color: "#ef4444", bg: "#fee2e2" },
};

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <h3>Recent Studies</h3>
        <button className={styles.viewAll} onClick={() => navigate('/studies')}>View all studies</button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : error ? (
          <p className={styles.empty}>{error}</p>
        ) : studies.length === 0 ? (
          <p className={styles.empty}>No recent studies.</p>
        ) : (
          studies.map((study) => (
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
                <span>Authors: {study.authorCount ?? 0}</span>
                <span>
                  Last Modified:{" "}
                  {study.dateModified ? new Date(study.dateModified).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentStudies;