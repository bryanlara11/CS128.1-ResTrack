import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Studies.module.css";

const STATUS_CONFIG = {
  "Under Review": { color: "#374850", bg: "#fef3c7" },
  "Approved":     { color: "#374850", bg: "#d1fae5" },
  "Pending":     { color: "#374850", bg: "#fee2e2" },
  "For Revision": { color: "#374850", bg: "#f3f4f6" },
};

  const studies = [
    {
      id: 1,
      title: "STUDY 1",
      hru: "HRU-2026-001",
      department: "Cardiology",
      status: "Under Review",
      statusClass: "underReview",
      authors: 3,
      date: "Jan 2026",
    },
    {
      id: 2,
      title: "STUDY 2",
      hru: "HRU-2026-002",
      department: "Oncology",
      status: "Approved",
      statusClass: "approved",
      authors: 2,
      date: "Jan 2026",
    },
  ];
function StudyCard({ study, onExpand }) {
  const status = STATUS_CONFIG[study.status] || STATUS_CONFIG["Draft"];
  return (
    <div className={styles.studyCard}>
      <div className={styles.cardTop}>
        <span className={styles.studyTitle}>{study.title}</span>
        <button className={styles.eyeButton} onClick={() => onExpand(study)}>
          <i class="bi bi-eye"></i>
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
        <span className={styles.authors}>Authors: {study.authors}</span>
        <span className={styles.dateModified}>Date Modified: {study.date}</span>
      </div>
    </div>
  );
}

function Studies() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
        <h2 className={styles.heading}>YOUR RESEARCH STUDIES</h2>
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
            <StudyCard key={study.id} study={study} onExpand={() => navigate(`/study/${study.id}`)} />
          ))
        ) : (
          <p className={styles.empty}>No studies found.</p>
        )}
      </div>
    </div>
  );
}

export default Studies;