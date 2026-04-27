import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Studies.module.css";

const STATUS_CONFIG = {
  "Under Review": { color: "#374850", bg: "#fef3c7" },
  "Approved":     { color: "#374850", bg: "#d1fae5" },
  "Pending":      { color: "#374850", bg: "#fee2e2" },
  "For Revision": { color: "#374850", bg: "#f3f4f6" },
};

function StudyCard({ study }) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[study.status] || { color: "#374850", bg: "#f3f4f6" };

  return (
    <div className={styles.studyCard}>
      <div className={styles.cardTop}>
        <span className={styles.studyTitle}>{study.title}</span>
        <button className={styles.eyeButton} onClick={() => navigate(`/studies/${study.id}`)}>
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
        <span className={styles.authors}>Authors: {study.authorCount ?? study.authors?.length ?? 0}</span>
        <span className={styles.dateModified}>Date Modified: {study.dateModified || study.dateCreated || ""}</span>
      </div>
    </div>
  );
}

function Studies() {
  const [studies, setStudies] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeSection, setActiveSection] = useState("Submitted");
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
        const res = await fetch("http://localhost:5000/api/studies/my", {
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

  const filtered = studies.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.hru.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    const matchSection = activeSection === "Drafts" ? s.status === "Draft" : s.status !== "Draft";
    return matchSearch && matchStatus && matchSection;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.heading}>YOUR RESEARCH STUDIES</h2>
      </div>

      <div className={styles.sectionToggle}>
        <button
          className={`${styles.toggleButton} ${activeSection === "Submitted" ? styles.toggleActive : ""}`}
          onClick={() => setActiveSection("Submitted")}
        >
          Submitted
        </button>
        <button
          className={`${styles.toggleButton} ${activeSection === "Drafts" ? styles.toggleActive : ""}`}
          onClick={() => setActiveSection("Drafts")}
        >
          Drafts
        </button>
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
        {activeSection === "Submitted" && (
          <select
            className={styles.statusDropdown}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {Object.keys(STATUS_CONFIG).filter((s) => s !== "Draft").map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : error ? (
          <p className={styles.empty}>{error}</p>
        ) : filtered.length > 0 ? (
          filtered.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))
        ) : (
          <p className={styles.empty}>No studies found.</p>
        )}
      </div>
    </div>
  );
}

export default Studies;