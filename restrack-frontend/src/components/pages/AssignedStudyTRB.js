import React, { useState, useEffect } from "react";
import styles from "./AssignedStudy.module.css";
import { useNavigate, useParams } from "react-router-dom";

const TABS = ["Reviews", "Overview", "Authors", "Documents", "History", "Bioinformatics"];

const STATUS_CONFIG = [
  { key: "Assigned",               label: "Assigned Studies",       color: "#6366f1" },
  { key: "Pending Review",         label: "Pending Review",         color: "#f59e0b" },
  { key: "Under Review",           label: "Under Review",           color: "#3b82f6" },
  { key: "Forwarded to Reviewers", label: "Forwarded to Reviewers", color: "#8b5cf6" },
  { key: "Completed",              label: "Completed",              color: "#10b981" },
];

function ReviewsContent({ study, onSubmitReview }) {
  const STATUS_COLORS = {
    "Approved":               { color: "#10b981", bg: "#d1fae5" },
    "Pending":                { color: "#f59e0b", bg: "#fef3c7" },
    "For Minor Modification": { color: "#3b82f6", bg: "#dbeafe" },
    "For Major Modification": { color: "#f97316", bg: "#ffedd5" },
    "Disapproved":            { color: "#ef4444", bg: "#fee2e2" },
    "Forwarded to Reviewers": { color: "#8b5cf6", bg: "#ede9fe" },
  };

  const [reviewStatus, setReviewStatus] = useState("Pending");
  const [reviewComment, setReviewComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "" });

  const showModal = (message) => setModal({ show: true, message });
  const closeModal = () => setModal({ show: false, message: "" });

  const handleSubmit = async () => {
    if (!reviewComment.trim()) { showModal("Please provide feedback comments."); return; }
    const success = await onSubmitReview({ status: reviewStatus, feedback: reviewComment });
    if (success !== false) {
      setSubmitted(true);
    }
  };

  return (
    <div className={styles.tabSection}>
      <h4 className={styles.tabSectionTitle}>Past Reviews</h4>
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

      <h4 className={styles.tabSectionTitle}>Submit Your Review</h4>
      {submitted ? (
        <div className={styles.successMsg}>
          <i className="bi bi-check-circle"></i> Review submitted successfully.
        </div>
      ) : (
        <div className={styles.reviewForm}>
          <div className={styles.reviewFormField}>
            <label className={styles.reviewFormLabel}>Status</label>
            <select
              className={styles.reviewSelect}
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}>
              <option value="Approved">Approved</option>
              <option value="For Minor Modification">For Minor Modification</option>
              <option value="For Major Modification">For Major Modification</option>
              <option value="Disapproved">Disapproved</option>
              <option value="Pending">Pending</option>
              <option value="Forwarded to Reviewers">Forwarded to Reviewers</option>
            </select>
          </div>
          <div className={styles.reviewFormField}>
            <label className={styles.reviewFormLabel}>Comments</label>
            <textarea
              className={styles.reviewTextarea}
              placeholder="Write your feedback here..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
          </div>
          <button className={styles.reviewSubmitBtn} onClick={handleSubmit}>
            Submit Review
          </button>
        </div>
      )}

      {modal.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Notice</h3>
            <p>{modal.message}</p>
            <div className={styles.modalActions}>
              <button className={styles.confirmBtn} onClick={closeModal}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  return (
    <div className={styles.tabSection}>
      <h4 className={styles.tabSectionTitle}>Documents</h4>
      <div className={styles.docList}>
        {study.documents?.length > 0 ? study.documents.map((doc, i) => (
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

function HistoryContent({ study }) {
  return (
    <div className={styles.tabSection}>
      <h4 className={styles.tabSectionTitle}>Review History</h4>
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
        )) : <p className={styles.empty}>No review history yet.</p>}
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

function AssignedStudyTRB() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const { id } = useParams();
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudy = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/studies/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setStudy(null);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setStudy(data.study || null);
      } catch (err) {
        console.error("Failed to fetch TRB study:", err);
        setStudy(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudy();
  }, [id]);
  const status = study ? STATUS_CONFIG.find((s) => s.key === study.status) : null;

  const handleSubmitReview = async (review) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5000/api/studies/${id}/trb-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: review.status, remarks: review.feedback }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit TRB review");

      const updatedStudy = {
        ...study,
        status: data.status || review.status,
        reviews: [
          ...(study.reviews || []),
          {
            reviewer: "TRB Chair",
            status: review.status,
            feedback: review.feedback,
            date: new Date().toLocaleDateString(),
          },
        ],
        history: [
          ...(study.history || []),
          {
            action: `Review submitted: ${review.status}`,
            by: "TRB Chair",
            date: new Date().toLocaleDateString(),
          },
        ],
      };

      setStudy(updatedStudy);
      return true;
    } catch (err) {
      console.error("TRB review submission failed:", err);
      return false;
    }
  };

  return (
    <div className={styles.page}>
      {loading ? (
        <p>Loading study...</p>
      ) : !study ? (
        <p>Study not found.</p>
      ) : (
        <>
          <div className={styles.header}>
            <h1 className={styles.title}>{study.title}</h1>
            <button className={styles.backButton} onClick={() => navigate("/trb-chair/assignments")}>
              <i className="bi bi-arrow-left"></i> Back
            </button>
          </div>

          <div className={styles.chip}>
            <span
              className={styles.statusChip}
              style={{ color: status?.color, backgroundColor: status?.bg }}>
              {study.status}
            </span>
            <span className={styles.hrudept}>{study.hru}</span>
            <span className={styles.dot}>•</span>
            <span className={styles.hrudept}>{study.department}</span>
          </div>

          {study.deadline && (() => {
            const daysLeft = Math.ceil((new Date(study.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <div className={styles.deadlineBar}>
                <i className="bi bi-clock"></i>
                <span>Review deadline: <strong>{study.deadline}</strong></span>
                <span className={
                  daysLeft < 0 ? styles.deadlineOverdue :
                  daysLeft <= 3 ? styles.deadlineUrgent :
                  styles.deadlineSafe
                }>
                  {daysLeft < 0 ? "Overdue" : `${daysLeft} days left`}
                </span>
              </div>
            );
          })()}

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
              {activeTab === "Reviews" && <ReviewsContent study={study} onSubmitReview={handleSubmitReview} />}
              {activeTab === "Overview" && <OverviewContent study={study} />}
              {activeTab === "Authors" && <AuthorsContent study={study} />}
              {activeTab === "Documents" && <DocumentsContent study={study} />}
              {activeTab === "History" && <HistoryContent study={study} />}
              {activeTab === "Bioinformatics" && <BioinformaticsContent study={study} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AssignedStudyTRB;