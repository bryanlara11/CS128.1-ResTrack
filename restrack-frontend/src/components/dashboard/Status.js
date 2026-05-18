import React, { useEffect, useState } from "react";
import styles from "./Status.module.css";
import { API_BASE_URL } from "../../config";

const STATUSES = [
  { key: "Approved",               label: "Approved",               color: "#10b981" },
  { key: "Pending",                label: "Pending",                color: "#f59e0b" },
  { key: "For Minor Modification", label: "For Minor Modification", color: "#3b82f6" },
  { key: "For Major Modification",       label: "For Major Modification",       color: "#f97316" },
  { key: "Disapproved",            label: "Disapproved",            color: "#ef4444" },
];

function Status() {
  const [counts, setCounts] = useState({
    "Approved": 0,
    "Pending": 0,
    "For Minor Modification": 0,
    "For Major Modification": 0,
    "Disapproved": 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      const studies = JSON.parse(localStorage.getItem("studies") || "[]");
      const newCounts = { "Approved": 0, "Pending": 0, "For Minor Modification": 0, "For Major Modification": 0, "Disapproved": 0 };
      studies.forEach((s) => {
        if (newCounts[s.status] !== undefined) newCounts[s.status]++;
      });
      setCounts(newCounts);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/dashboard/researcher/stats`, {
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
      {STATUSES.map(({ key, label, color }) => (
        <div key={key} className={styles.card} style={{ borderLeft: `5px solid ${color}` }}>
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

export default Status;