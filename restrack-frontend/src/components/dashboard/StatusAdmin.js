import React, { useEffect, useState } from "react";
import styles from "./StatusAdmin.module.css";
import { API_BASE_URL } from "../../config";

const STATUSES = [
  { key: "Total Studies",       label: "Total Studies",       color: "#6366f1" },
  { key: "Total Users",         label: "Total Users",         color: "#10b981" },
  { key: "Pending Assignments", label: "Pending Assignments", color: "#f59e0b" },
  { key: "Approval Rate",       label: "Approval Rate",       color: "#3b82f6" },
];

function StatusAdmin() {
  const [counts, setCounts] = useState({
    "Total Studies": 0,
    "Total Users": 0,
    "Pending Assignments": 0,
    "Approval Rate": "0%",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      const studies = JSON.parse(localStorage.getItem("studies") || "[]");
      const users = JSON.parse(localStorage.getItem("users") || "[]");

      const totalStudies = studies.filter((s) => s.status !== "Draft").length;
      const totalUsers = users.length;
      const pendingAssignments = studies.filter((s) => s.status !== "Draft" && !s.assignedTRB).length;

      const completedStudies = studies.filter((s) =>
        s.reviews?.some((r) => r.status === "Approved" || r.status === "TRB Approved" || r.status === "TRB Approved with Final Paper")
      ).length;
      const approvalRate = totalStudies > 0
        ? `${Math.round((completedStudies / totalStudies) * 100)}%`
        : "0%";

      setCounts({
        "Total Studies": totalStudies,
        "Total Users": totalUsers,
        "Pending Assignments": pendingAssignments,
        "Approval Rate": approvalRate,
      });
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/dashboard/admin/stats`, {
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