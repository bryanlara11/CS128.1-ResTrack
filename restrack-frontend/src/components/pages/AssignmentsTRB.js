import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Assignments.module.css";

const STATUS_CONFIG = [
  { key: "Assigned",               label: "Assigned Studies",       color: "#6366f1" },
  { key: "Pending Review",         label: "Pending Review",         color: "#f59e0b" },
  { key: "Under Review",           label: "Under Review",           color: "#3b82f6" },
  { key: "Forwarded to Reviewers", label: "Forwarded to Reviewers", color: "#8b5cf6" },
  { key: "Completed",              label: "Completed",              color: "#10b981" },
];

function AssignmentCard({ study }) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG.find((s) => s.key === study.status) || { color: "#6b7280" };

  return (
    <div className={styles.studyCard}>
      <div className={styles.cardTop}>
        <span className={styles.studyTitle}>{study.title}</span>
        <button className={styles.eyeButton} onClick={() => navigate(`/trb-chair/assignments/${study.id}`)}>
          <i className="bi bi-eye"></i>
        </button>
      </div>
      <div className={styles.cardColors}>
        <span className={styles.hru}>{study.hru}</span>
        <span className={styles.dot}>•</span>
        <span className={styles.department}>{study.department}</span>
      </div>
      <div className={styles.cardStatus}>
        <span
          className={styles.statusChip}
          style={{ color: status.color, backgroundColor: status.bg }}
        >
          {study.status}
        </span>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.authors}>Authors: {study.authorList?.length ?? study.authors ?? 0}</span>
        <span className={styles.dateModified}>Date Modified: {study.date}</span>
      </div>

      {study.deadline && (() => {
        const daysLeft = Math.ceil((new Date(study.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const color = daysLeft < 0 ? "#ef4444" : daysLeft <= 3 ? "#f97316" : "#6b7280";
        return (
          <div className={styles.deadline} style={{ color }}>
            <i className="bi bi-clock"></i> Deadline: {study.deadline} · {daysLeft < 0 ? "Overdue" : `${daysLeft} days left`}
          </div>
        );
      })()}
    </div>
  );
}

function AssignmentsTRB() {
  const [studies, setStudies] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssignments = async () => {
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
        const assignments = Array.isArray(data.studies) ? data.studies : [];
        setStudies(assignments.filter((s) => s.status !== "Draft"));
      } catch (err) {
        console.error("Failed to fetch TRB assignments:", err);
        setError(err.message || "Failed to load assignments");
        setStudies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const filtered = studies.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.hru.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.heading}>ASSIGNMENTS</h2>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchWrapper}>
          <i className={`bi bi-search ${styles.searchIcon}`}></i>
          <input
            className={styles.searchInput}
            placeholder="Search by title or HRU number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.statusDropdown}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          {STATUS_CONFIG.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.list}>
        {filtered.length > 0 ? (
          filtered.map((study) => (
            <AssignmentCard key={study.id} study={study} />
          ))
        ) : (
          <p className={styles.empty}>No assignments found.</p>
        )}
      </div>
    </div>
  );
}

export default AssignmentsTRB;