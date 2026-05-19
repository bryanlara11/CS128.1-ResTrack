import React, { useState } from "react";
import styles from "./StudyDocumentsList.module.css";
import { downloadStudyDocument } from "../../utils/downloadDocument";

function StudyDocumentsList({ studyId, documents = [], emptyMessage = "No documents uploaded." }) {
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");

  const handleDownload = async (doc) => {
    const docKey = doc.id || doc.name;
    setDownloadingId(docKey);
    setError("");
    try {
      await downloadStudyDocument(studyId, doc);
    } catch (err) {
      setError(err?.message || "Unable to download this document.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!documents.length) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.docList}>
        {documents.map((doc, i) => {
          const docKey = doc.id || `${doc.name}-${i}`;
          const isDownloading = downloadingId === docKey;
          return (
            <div key={docKey} className={styles.docItem}>
              <i className="bi bi-file-earmark-text"></i>
              <div className={styles.docInfo}>
                <span className={styles.docName}>{doc.name}</span>
                {doc.uploadedAt ? (
                  <span className={styles.docMeta}>Uploaded: {doc.uploadedAt}</span>
                ) : null}
              </div>
              <button
                type="button"
                className={styles.downloadBtn}
                onClick={() => handleDownload(doc)}
                disabled={isDownloading}
                aria-label={`Download ${doc.name}`}
              >
                <i className="bi bi-download"></i>
                {isDownloading ? "Downloading..." : "Download"}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default StudyDocumentsList;
