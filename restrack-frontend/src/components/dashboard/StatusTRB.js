import React, { useEffect, useState } from "react";
import styles from "./StatusReviewer.module.css";

const STATUSES = [
  { key: "Assigned",               label: "Assigned Studies",       color: "#6366f1" },
  { key: "Pending Review",         label: "Pending Review",         color: "#f59e0b" },
  { key: "Under Review",           label: "Under Review",           color: "#3b82f6" },
  { key: "Forwarded to Reviewers", label: "Forwarded to Reviewers", color: "#8b5cf6" },
  { key: "Completed",              label: "Completed",              color: "#10b981" },
];

function StatusTRB() {
  const [counts, setCounts] = useState({
    "Assigned": 0,
    "Pending Review": 0,
    "Under Review": 0,
    "Forwarded to Reviewers": 0,
    "Completed": 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      const studies = JSON.parse(localStorage.getItem("studies") || "[]");

      const newCounts = {
        "Assigned": 0,
        "Pending Review": 0,
        "Under Review": 0,
        "Forwarded to Reviewers": 0,
        "Completed": 0,
      };

      studies.forEach((s) => {
        if (newCounts[s.status] !== undefined) {
          newCounts[s.status]++;
        }
      });

      setCounts(newCounts);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/dashboard/trb/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok && data?.counts) {
          setCounts(data.counts);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className={styles.grid}>
      {STATUSES.map(({ key, label, color }) => (
        <div
          key={key}
          className={styles.card}
          style={{ borderLeft: `5px solid ${color}` }}
        >
          <div className={styles.cardContent}>
            <div className={styles.text}>
              <span className={styles.label}>{label}</span>
              <span className={styles.value} style={{ color }}>
                {loading ? "—" : counts[key]}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatusTRB;