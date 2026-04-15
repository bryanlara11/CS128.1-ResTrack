import React, { useState } from "react";
import styles from "./SpecificStudy.module.css";
import { useNavigate } from "react-router-dom";

const TABS = ["Overview", "Authors", "Documents", "Reviews", "History", "Bioinformatics"];

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

function SpecificStudy() {
  const [activeTab, setActiveTab] = useState("Overview");
  const study = studies[0];
  const status = STATUS_CONFIG[study.status];

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h1 className={styles.title}>{study.title}</h1>
        <button className={styles.editButton}>
          <i className="bi bi-pencil"></i> Edit Study
        </button>
      </div>

      <div className={styles.chip}>
        <span
          className={styles.statusChip}
          style={{ color: status.color, backgroundColor: status.bg }}>{study.status}
        </span>
        <span className={styles.hrudept}>{study.hru}</span>
        <span className={styles.dot}>•</span>
        <span className={styles.hrudept}>{study.department}</span>
      </div>

      <div className={styles.subBox}>
        <div className={styles.tabSidebar}>
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === "Overview" && <p>Overview</p>}
          {activeTab === "Authors" && <p>Authors</p>}
          {activeTab === "Documents" && <p>Documents</p>}
          {activeTab === "Reviews" && <p>Reviews</p>}
          {activeTab === "History" && <p>History</p>}
          {activeTab === "Bioinformatics" && <p>Bioinformatics</p>}
        </div>
      </div>

    </div>
  );
}

export default SpecificStudy;