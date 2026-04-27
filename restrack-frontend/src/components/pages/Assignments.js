import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Assignments.module.css";

const STATUS_CONFIG = {
  "Approved":               { color: "#10b981", bg: "#d1fae5" },
  "Pending":                { color: "#f59e0b", bg: "#fef3c7" },
  "For Minor Modification": { color: "#3b82f6", bg: "#dbeafe" },
  "For Modification":       { color: "#f97316", bg: "#ffedd5" },
  "Disapproved":            { color: "#ef4444", bg: "#fee2e2" },
};

function AssignmentCard({ study }) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[study.status] || { color: "#6b7280", bg: "#f3f4f6" };

  return (
    <div className={styles.studyCard}>
      <div className={styles.cardTop}>
        <span className={styles.studyTitle}>{study.title}</span>
        <button className={styles.eyeButton} onClick={() => navigate(`/assignments/${study.id}`)}>
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
    </div>
  );
}

function Assignments() {
  const [studies, setStudies] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("studies") || "[]");
    // reviewers see all submitted studies (not drafts)
    setStudies(saved.filter((s) => s.status !== "Draft"));
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
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map((s) => (
            <option key={s} value={s}>{s}</option>
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

export default Assignments;