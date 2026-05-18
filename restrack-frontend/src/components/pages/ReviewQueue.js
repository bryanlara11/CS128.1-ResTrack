import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ReviewQueue.module.css";
import { API_BASE_URL } from "../../config";

const STATUS_CONFIG = [
  { key: "Draft",                  label: "Draft",                  color: "#6b7280" },
  { key: "Assigned",               label: "Assigned",               color: "#6366f1" },
  { key: "Pending Review",         label: "Pending Review",         color: "#f59e0b" },
  { key: "Forwarded to Reviewers", label: "Forwarded to Reviewers", color: "#8b5cf6" },
  { key: "Completed",              label: "Completed",              color: "#10b981" },
];

function StudyCard({ study }) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG.find((s) => s.key === study.status) || { color: "#6b7280" };

  return (
    <div className={styles.studyCard}>
      <div className={styles.cardTop}>
        <span className={styles.studyTitle}>{study.title}</span>
        <button className={styles.eyeButton} onClick={() => navigate(`/admin/review-queue/${study.id}`)}>
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

      {study.deadline && (study.assignedTRB || study.assignedReviewers?.reviewer1) && (() => {
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

function ReviewQueue() {
  const [studies, setStudies] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/studies/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.studies) {
          setStudies(data.studies);
        }
      } catch (err) {
        console.error("Error fetching studies:", err);
      }
    };
    fetchStudies();
  }, []);

  const filtered = studies.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.hru.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.heading}>REVIEW QUEUE</h2>
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
      </div>

      <div className={styles.list}>
        {filtered.length > 0 ? (
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

export default ReviewQueue;