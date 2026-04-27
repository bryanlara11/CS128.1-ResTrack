import React, { useState, useEffect } from "react";
import styles from "./SpecificStudy.module.css";
import { useNavigate, useParams } from "react-router-dom";

const TABS = ["Overview", "Authors", "Documents", "Reviews", "History", "Bioinformatics"];

const STATUS_CONFIG = {
  "Under Review": { color: "#374850", bg: "#fef3c7" },
  "Approved":     { color: "#374850", bg: "#d1fae5" },
  "Pending":      { color: "#374850", bg: "#fee2e2" },
  "For Revision": { color: "#374850", bg: "#f3f4f6" },
};

function OverviewContent({ study }) {
  return (
    <div className={styles.tabSection}>
      <div className={styles.overviewGrid}>
        <div className={styles.overviewField}>
          <span className={styles.overviewLabel}>Abstract</span>
          <p className={styles.overviewValue}>{study.abstract || "No abstract provided."}</p>
        </div>
        <div className={styles.overviewField}>
          <span className={styles.overviewLabel}>Department</span>
          <p className={styles.overviewValue}>{study.department}</p>
        </div>
        <div className={styles.overviewField}>
          <span className={styles.overviewLabel}>HRA Alignment</span>
          <p className={styles.overviewValue}>{study.hraAlignment || "—"}</p>
        </div>
        <div className={styles.overviewField}>
          <span className={styles.overviewLabel}>Submitted By</span>
          <p className={styles.overviewValue}>{study.submittedBy || "—"}</p>
        </div>
        <div className={styles.overviewField}>
          <span className={styles.overviewLabel}>Date Created</span>
          <p className={styles.overviewValue}>{study.dateCreated || "—"}</p>
        </div>
        <div className={styles.overviewField}>
          <span className={styles.overviewLabel}>Date Modified</span>
          <p className={styles.overviewValue}>{study.date}</p>
        </div>
      </div>
    </div>
  );
}

function AuthorsContent({ study }) {
  return (
    <div className={styles.tabSection}>
      <h4 className={styles.tabSectionTitle}>Authors & Co-Authors</h4>
      <div className={styles.authorList}>
        {study.authorList?.length > 0 ? study.authorList.map((author, i) => (
          <div key={i} className={styles.authorItem}>
            <div className={styles.authorAvatar}>{author.name.charAt(0)}</div>
            <div className={styles.authorInfo}>
              <span className={styles.authorName}>{author.name}</span>
              <span className={styles.authorMeta}>{author.email}</span>
              <span className={styles.authorMeta}>{author.department || "No department"}</span>
            </div>
          </div>
        )) : <p className={styles.empty}>No authors listed.</p>}
      </div>
    </div>
  );
}

function DocumentsContent({ study }) {
  const [docs, setDocs] = useState(study.documents ? [...study.documents] : []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocs([...docs, { name: file.name, uploadedAt: new Date().toLocaleDateString(), file }]);
  };

  return (
    <div className={styles.tabSection}>
      <div className={styles.docHeader}>
        <h4 className={styles.tabSectionTitle}>Documents</h4>
        <label className={styles.uploadBtn}>
          <i className="bi bi-upload"></i> Upload Document
          <input type="file" hidden onChange={handleUpload} />
        </label>
      </div>
      <div className={styles.docList}>
        {docs.length > 0 ? docs.map((doc, i) => (
          <div key={i} className={styles.docItem}>
            <i className="bi bi-file-earmark-text"></i>
            <div className={styles.docInfo}>
              <span className={styles.docName}>{doc.name}</span>
              <span className={styles.docMeta}>Uploaded: {doc.uploadedAt}</span>
            </div>
          </div>
        )) : <p className={styles.empty}>No documents uploaded.</p>}
      </div>
    </div>
  );
}

function ReviewsContent({ study }) {
  const STATUS_COLORS = {
    "Approved":     { color: "#10b981", bg: "#d1fae5" },
    "Rejected":     { color: "#ef4444", bg: "#fee2e2" },
    "For Revision": { color: "#f59e0b", bg: "#fef3c7" },
    "Pending":      { color: "#6b7280", bg: "#f3f4f6" },
  };

  return (
    <div className={styles.tabSection}>
      <h4 className={styles.tabSectionTitle}>Reviewer Feedback</h4>
      <div className={styles.reviewList}>
        {study.reviews?.length > 0 ? study.reviews.map((review, i) => {
          const s = STATUS_COLORS[review.status] || STATUS_COLORS["Pending"];
          return (
            <div key={i} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <span className={styles.reviewerName}>{review.reviewer}</span>
                <span className={styles.reviewChip} style={{ color: s.color, backgroundColor: s.bg }}>
                  {review.status}
                </span>
              </div>
              <p className={styles.reviewText}>{review.feedback || "No feedback provided."}</p>
              <span className={styles.reviewDate}>{review.date}</span>
            </div>
          );
        }) : <p className={styles.empty}>No reviews yet.</p>}
      </div>
    </div>
  );
}

function HistoryContent({ study }) {
  return (
    <div className={styles.tabSection}>
      <h4 className={styles.tabSectionTitle}>Revision History</h4>
      <div className={styles.timeline}>
        {study.history?.length > 0 ? study.history.map((entry, i) => (
          <div key={i} className={styles.timelineItem}>
            <div className={styles.timelineDot}></div>
            {i < study.history.length - 1 && <div className={styles.timelineLine}></div>}
            <div className={styles.timelineContent}>
              <span className={styles.timelineAction}>{entry.action}</span>
              <span className={styles.timelineMeta}>{entry.by} · {entry.date}</span>
            </div>
          </div>
        )) : <p className={styles.empty}>No history yet.</p>}
      </div>
    </div>
  );
}

function BioinformaticsContent({ study }) {
  const bio = study.bioinformatics;
  if (!bio) return <p className={styles.empty}>No bioinformatics data for this study.</p>;

  return (
    <div className={styles.tabSection}>
      <h4 className={styles.tabSectionTitle}>Results</h4>
      <div className={styles.overviewGrid}>
        {[["Organism Name", bio.results?.organismName],["Study Type", bio.results?.studyType],["Data Type", bio.results?.dataType],["Database Source", bio.results?.databaseSource],["Software Tool", bio.results?.softwareTool],["File Format", bio.results?.fileFormat],["Accession No", bio.results?.accessionNo],["Sequence Type", bio.results?.sequenceType]].map(([label, value]) => (
          <div className={styles.overviewField} key={label}>
            <span className={styles.overviewLabel}>{label}</span>
            <p className={styles.overviewValue}>{value || "—"}</p>
          </div>
        ))}
        {bio.results?.notes && (
          <div className={`${styles.overviewField} ${styles.fullWidth}`}>
            <span className={styles.overviewLabel}>Notes</span>
            <p className={styles.overviewValue}>{bio.results.notes}</p>
          </div>
        )}
      </div>

      <h4 className={styles.tabSectionTitle}>Samples</h4>
      {bio.samples?.length > 0 ? bio.samples.map((s, i) => (
        <div key={i} className={styles.bioCard}>
          <div className={styles.overviewGrid}>
            {[["Sample Code", s.sampleCode],["Sample Type", s.sampleType],["Organism Name", s.organismName],["Collection Date", s.collectionDate],["Collection Site", s.collectionSite]].map(([label, value]) => (
              <div className={styles.overviewField} key={label}>
                <span className={styles.overviewLabel}>{label}</span>
                <p className={styles.overviewValue}>{value || "—"}</p>
              </div>
            ))}
            {s.remarks && (
              <div className={`${styles.overviewField} ${styles.fullWidth}`}>
                <span className={styles.overviewLabel}>Remarks</span>
                <p className={styles.overviewValue}>{s.remarks}</p>
              </div>
            )}
          </div>
        </div>
      )) : <p className={styles.empty}>No samples.</p>}

      <h4 className={styles.tabSectionTitle}>Datasets</h4>
      {bio.datasets?.length > 0 ? bio.datasets.map((d, i) => (
        <div key={i} className={styles.bioCard}>
          <div className={styles.overviewGrid}>
            {[["Dataset Name", d.datasetName],["Data Type", d.dataType],["File Format", d.fileFormat],["File Size", d.fileSize],["Accession No", d.accessionNo],["Upload Date", d.uploadDate]].map(([label, value]) => (
              <div className={styles.overviewField} key={label}>
                <span className={styles.overviewLabel}>{label}</span>
                <p className={styles.overviewValue}>{value || "—"}</p>
              </div>
            ))}
            <div className={styles.overviewField}>
              <span className={styles.overviewLabel}>Is Raw Data</span>
              <p className={styles.overviewValue}>{d.isRawData ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      )) : <p className={styles.empty}>No datasets.</p>}

      <h4 className={styles.tabSectionTitle}>Tools</h4>
      {bio.tools?.length > 0 ? bio.tools.map((t, i) => (
        <div key={i} className={styles.bioCard}>
          <div className={styles.overviewGrid}>
            {[["Tool Name", t.toolName],["Version", t.toolVersion],["Purpose", t.purpose],["Parameters", t.parameters],["Reference Database", t.referenceDatabase],["Date Used", t.dateUsed]].map(([label, value]) => (
              <div className={styles.overviewField} key={label}>
                <span className={styles.overviewLabel}>{label}</span>
                <p className={styles.overviewValue}>{value || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )) : <p className={styles.empty}>No tools listed.</p>}
    </div>
  );
}

function SpecificStudy() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const { id } = useParams();
  const [study, setStudy] = useState(null);
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
        const res = await fetch(`http://localhost:5000/api/studies/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load study");
        setStudy(data.study || null);
      } catch (e) {
        setError(e?.message || "Failed to load study");
        setStudy(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const status = study ? STATUS_CONFIG[study.status] : null;

  return (
    <div className={styles.page}>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p>{error}</p>
      ) : !study ? (
        <p>Study not found.</p>
      ) : (
        <>
          <div className={styles.header}>
            <h1 className={styles.title}>{study.title}</h1>
            <button className={styles.editButton} onClick={() => navigate(`/studies/${study.id}/edit`)}>
              <i className="bi bi-pencil"></i> Edit Study
            </button>
          </div>

          <div className={styles.chip}>
            <span
              className={styles.statusChip}
              style={{ color: status?.color, backgroundColor: status?.bg }}
            >
              {study.status}
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
              {activeTab === "Overview" && <OverviewContent study={study} />}
              {activeTab === "Authors" && <AuthorsContent study={study} />}
              {activeTab === "Documents" && <DocumentsContent study={study} />}
              {activeTab === "Reviews" && <ReviewsContent study={study} />}
              {activeTab === "History" && <HistoryContent study={study} />}
              {activeTab === "Bioinformatics" && <BioinformaticsContent study={study} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SpecificStudy;