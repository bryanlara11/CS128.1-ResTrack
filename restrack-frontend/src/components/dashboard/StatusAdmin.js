import React, { useEffect, useState } from "react";
import styles from "./StatusAdmin.module.css";

const STATUSES = [
  { key: "Total Studies",    label: "Total Studies",    color: "#6366f1" },
  { key: "Total Users",      label: "Total Users",      color: "#10b981" },
  { key: "Pending Reviews",  label: "Pending Reviews",  color: "#f59e0b" },
  { key: "Approval Rate",    label: "Approval Rate",    color: "#3b82f6" },
];

function StatusAdmin() {
  const [counts, setCounts] = useState({
    "Total Studies": 0,
    "Total Users": 0,
    "Pending Reviews": 0,
    "Approval Rate": "0%",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      // Mock data for demo
      setCounts({
        "Total Studies": 1234,
        "Total Users": 456,
        "Pending Reviews": 23,
        "Approval Rate": "89%",
      });
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/dashboard/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok && data?.counts) {
          setCounts(data.counts);
        }
      } catch (error) {
        console.error("Admin stats error:", error);
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

export default StatusAdmin;