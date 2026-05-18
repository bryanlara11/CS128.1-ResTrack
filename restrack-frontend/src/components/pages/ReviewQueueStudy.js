import React, { useState, useEffect, useCallback } from "react";
import styles from "./ReviewQueueStudy.module.css";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config";

const TABS = ["Assignments", "Overview", "Authors", "Documents", "Reviews", "Activities", "Bioinformatics"];

function AssignmentsContent({ study, onAssign, onSaveRegistration }) {
  const [trbUsers, setTrbUsers] = useState([]);
  const [reviewerUsers, setReviewerUsers] = useState([]);
  const [selectedTRB, setSelectedTRB] = useState(study.assignedTRB || "");
  const [showReviewerModal, setShowReviewerModal] = useState(false);
  const [selectedReviewers, setSelectedReviewers] = useState(study.assignedReviewers || { reviewer1: "", reviewer2: "", plagiarism: "" });
  const [noticeModal, setNoticeModal] = useState({ show: false, message: "" });

  const [hru, setHru] = useState(study.hru || "");
  const [dateOfRegistration, setDateOfRegistration] = useState(study.dateOfRegistration || "");
  const [hraAlignment, setHraAlignment] = useState(study.hraAlignment || "");

  const trbHasReviewed = study.reviews?.some((r) => r.reviewer === "TRB Chair");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          const allUsers = data.users || [];
          setTrbUsers(allUsers.filter((u) => u.role_name === "TRB"));
          setReviewerUsers(allUsers.filter((u) => u.role_name === "Reviewer"));
        } else {
          console.error("Failed to fetch users", data);
        }
      } catch (err) {
        console.error("Error fetching users", err);
      }
    };
    fetchUsers();
  }, []);

  const handleSaveRegistration = () => {
    if (!hru.trim()) { setNoticeModal({ show: true, message: "HRU Registration Number is required." }); return; }
    if (!dateOfRegistration.trim()) { setNoticeModal({ show: true, message: "Date of Registration is required." }); return; }
    if (!hraAlignment.trim()) { setNoticeModal({ show: true, message: "HRA Alignment is required." }); return; }
    onSaveRegistration({ hru, dateOfRegistration, hraAlignment });
    setNoticeModal({ show: true, message: "Study registration details saved." });
  };

  const handleAssignTRB = () => {
    if (!selectedTRB) { setNoticeModal({ show: true, message: "Please select a TRB Chair." }); return; }
    onAssign({ assignedTRB: selectedTRB, assignedReviewers: study.assignedReviewers || { reviewer1: "", reviewer2: "", plagiarism: "" } });
    setNoticeModal({ show: true, message: "TRB Chair assigned successfully." });
  };

  const handleAssignReviewers = () => {
    if (!selectedReviewers.reviewer1) { setNoticeModal({ show: true, message: "Please assign at least Reviewer 1." }); return; }

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 15);
    const deadline = deadlineDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    onAssign({
      assignedTRB: study.assignedTRB || selectedTRB,
      assignedReviewers: selectedReviewers,
      deadline,
      assignmentDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    });
    setShowReviewerModal(false);
    setNoticeModal({ show: true, message: `Reviewers assigned. Deadline set to ${deadline}.` });
  };

  return (
    <div className={styles.tabSection}>

      <h4 className={styles.tabSectionTitle}>Study Registration</h4>
      <div className={styles.assignBox}>
        <div className={styles.assignField}>
          <label className={styles.assignLabel}>HRU Registration Number</label>
          <input
            className={styles.assignInput}
            value={hru}
            onChange={(e) => setHru(e.target.value)}/>
        </div>
        <div className={styles.assignField}>
          <label className={styles.assignLabel}>Date of Registration</label>
          <input
            className={styles.assignInput}
            type="date"
            value={dateOfRegistration}
            onChange={(e) => setDateOfRegistration(e.target.value)}
          />
        </div>
        <div className={styles.assignField}>
          <label className={styles.assignLabel}>HRA Alignment</label>
          <input
            className={styles.assignInput}
            value={hraAlignment}
            onChange={(e) => setHraAlignment(e.target.value)}
          />
        </div>
        <button className={styles.assignBtn} onClick={handleSaveRegistration}>
          Save Registration Details
        </button>
      </div>

      <h4 className={styles.tabSectionTitle}>TRB Chair Assignment</h4>
      <div className={styles.assignBox}>
        <div className={styles.assignField}>
          <label className={styles.assignLabel}>Assign TRB Chair</label>
          <select
            className={styles.assignSelect}
            value={selectedTRB}
            onChange={(e) => setSelectedTRB(e.target.value)}>
            <option value="">Select TRB Chair</option>
            {trbUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </select>
        </div>
        <button className={styles.assignBtn} onClick={handleAssignTRB}>
          Assign TRB Chair
        </button>
        {study.assignedTRB && (
          <span className={styles.assignedLabel}>
            <i className="bi bi-check-circle"></i> TRB Chair assigned
          </span>
        )}
      </div>

      <h4 className={styles.tabSectionTitle}>Reviewer Assignment</h4>
      {!trbHasReviewed && (
        <p className={styles.warningMsg}>
          <i className="bi bi-info-circle"></i> TRB chair must first provide feedback.
        </p>
      )}
      <div className={styles.assignBox}>
        <div className={styles.reviewerSlots}>
          {[["reviewer1", "Reviewer 1"], ["reviewer2", "Reviewer 2"], ["plagiarism", "Plagiarism Reviewer"]].map(([slot, label]) => (
            <div key={slot} className={styles.reviewerSlot}>
              <span className={styles.slotLabel}>{label}</span>
              <span className={styles.slotValue}>
                {selectedReviewers[slot]
                  ? reviewerUsers.find((u) => u.id === selectedReviewers[slot])
                    ? `${reviewerUsers.find((u) => u.id === selectedReviewers[slot]).first_name} ${reviewerUsers.find((u) => u.id === selectedReviewers[slot]).last_name}`
                    : "Assigned"
                  : "Not assigned"}
              </span>
            </div>
          ))}
        </div>
        {study.deadline && (
          <span className={styles.assignedLabel}>
            <i className="bi bi-clock"></i> Deadline: {study.deadline}
          </span>
        )}
        <button className={styles.assignBtn} onClick={() => setShowReviewerModal(true)}>
          Assign Reviewers
        </button>
      </div>

      {showReviewerModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Assign Reviewers</h3>
            <p>Select a reviewer for each slot (max 3). A 15-day deadline will be set automatically.</p>
            {[["reviewer1", "Reviewer 1"], ["reviewer2", "Reviewer 2"], ["plagiarism", "Plagiarism Reviewer"]].map(([slot, label]) => (
              <div key={slot} className={styles.modalSlot}>
                <label className={styles.slotLabel}>{label}</label>
                <select
                  className={styles.assignSelect}
                  value={selectedReviewers[slot]}
                  onChange={(e) => setSelectedReviewers((prev) => ({ ...prev, [slot]: e.target.value }))}>
                  <option value="">None</option>
                  {reviewerUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowReviewerModal(false)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleAssignReviewers}>Save</button>
            </div>
          </div>
        </div>
      )}

      {noticeModal.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Notice</h3>
            <p>{noticeModal.message}</p>
            <div className={styles.modalActions}>
              <button className={styles.confirmBtn} onClick={() => setNoticeModal({ show: false, message: "" })}>OK</button>
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
          <span className={styles.overviewLabel}>HRU Registration Number</span>
          <p className={styles.overviewValue}>{study.hru || "—"}</p>
        </div>
        <div className={styles.overviewField}>
          <span className={styles.overviewLabel}>Date of Registration</span>
          <p className={styles.overviewValue}>{study.dateOfRegistration || "—"}</p>
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

function ReviewsContent({ study }) {
  const STATUS_COLORS = {
    "Approved":               { color: "#10b981", bg: "#d1fae5" },
    "Pending":                { color: "#f59e0b", bg: "#fef3c7" },
    "For Minor Modification": { color: "#3b82f6", bg: "#dbeafe" },
    "For Major Modification": { color: "#f97316", bg: "#ffedd5" },
    "Disapproved":            { color: "#ef4444", bg: "#fee2e2" },
    "Forwarded to Reviewers": { color: "#8b5cf6", bg: "#ede9fe" },
  };

  return (
    <div className={styles.tabSection}>
      <h4 className={styles.tabSectionTitle}>Reviews</h4>
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
      <h4 className={styles.tabSectionTitle}>Activities</h4>
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
        )) : <p className={styles.empty}>No activities yet.</p>}
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
        {[["Organism Name", bio.results?.organismName],["Study Type", bio.results?.studyType],["Data Type", bio.results?.dataType],["Database Source", bio.results?.databaseSource],["Software Tool", bio.results?.softwareTool],["Accession No", bio.results?.accessionNo],["Sequence Type", bio.results?.sequenceType]].map(([label, value]) => (
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
            {[["Dataset Name", d.datasetName],["Data Type", d.dataType],["Accession No", d.accessionNo]].map(([label, value]) => (
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

function ReviewQueueStudy() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Assignments");
  const { id } = useParams();
  const [study, setStudy] = useState(null);
  
  const fetchStudy = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/studies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.study) {
        setStudy(data.study);
      }
    } catch (err) {
      console.error("Error fetching study:", err);
    }
  }, [id]);

  useEffect(() => {
    fetchStudy();
  }, [fetchStudy]);

  const updateBackend = async (payload) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/studies/${id}/admin-update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchStudy();
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleAssign = (assignmentData) => {
    updateBackend(assignmentData);
  };

  const handleSaveRegistration = (registrationData) => {
    updateBackend(registrationData);
  };

  return (
    <div className={styles.page}>
      {!study ? (
        <p>Study not found.</p>
      ) : (
        <>
          <div className={styles.header}>
            <h1 className={styles.title}>{study.title}</h1>
            <button className={styles.backButton} onClick={() => navigate("/admin/review-queue")}>
              <i className="bi bi-arrow-left"></i> Back
            </button>
          </div>

          <div className={styles.chip}>
          <span className={styles.hrudept}>{study.hru}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.hrudept}>{study.department}</span>
        </div>

          {study.deadline && study.assignedReviewers?.reviewer1 && (() => {
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
              {activeTab === "Assignments" && <AssignmentsContent study={study} onAssign={handleAssign} onSaveRegistration={handleSaveRegistration} />}
              {activeTab === "Overview" && <OverviewContent study={study} />}
              {activeTab === "Authors" && <AuthorsContent study={study} />}
              {activeTab === "Documents" && <DocumentsContent study={study} />}
              {activeTab === "Reviews" && <ReviewsContent study={study} />}
              {activeTab === "Activities" && <HistoryContent study={study} />}
              {activeTab === "Bioinformatics" && <BioinformaticsContent study={study} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ReviewQueueStudy;
