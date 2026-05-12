import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./NewStudy.module.css";
import { useNavigate, useParams } from "react-router-dom";

function NewStudy() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingDocs, setExistingDocs] = useState([]);
  const [hasBio, setHasBio] = useState(false);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [studyFile, setStudyFile] = useState(null);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 15);

  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const CURRENT_USER = useMemo(
    () => ({
      id: savedUser.id,
      name:
        savedUser.first_name && savedUser.last_name
          ? `${savedUser.first_name} ${savedUser.last_name}`
          : "You",
      email: savedUser.email || "",
      department: savedUser.department || "",
    }),
    [
      savedUser.id,
      savedUser.first_name,
      savedUser.last_name,
      savedUser.email,
      savedUser.department,
    ]
  );
  const [authors, setAuthors] = useState([{ ...CURRENT_USER }]);

  const [authorSuggestions, setAuthorSuggestions] = useState({});
  const [activeSuggestIndex, setActiveSuggestIndex] = useState(null);
  const debounceRef = useRef(null);

  const [modal, setModal] = useState({ show: false, message: "" });
  const [showConfirm, setShowConfirm] = useState(false);

  const showModal = (message) => setModal({ show: true, message });
  const closeModal = () => setModal({ show: false, message: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data?.user) return;

        setAuthors((prev) => {
          if (!prev?.length) return prev;
          const next = [...prev];
          next[0] = {
            ...next[0],
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            department: data.user.department,
          };
          return next;
        });
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/studies/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load study");

        const study = data.study || {};
        setTitle(study.title || "");
        setAbstract(study.abstract || "");
        setAuthors(
          study.authorList?.length > 0
            ? study.authorList.map((author) => ({
                id: author.id,
                name: author.name || "",
                email: author.email || "",
                department: author.department || "",
              }))
            : [{ ...CURRENT_USER }]
        );
        setExistingDocs(Array.isArray(study.documents) ? study.documents : []);
        setIsEditMode(true);
      } catch (err) {
        console.error("Failed to load study for edit:", err);
      }
    })();
  }, [id, CURRENT_USER]);

  const [bioResults, setBioResults] = useState({ organismName: "", studyType: "", dataType: "", databaseSource: "", softwareTool: "", fileFormat: "", accessionNo: "", sequenceType: "", notes: "" });
  const [bioSamples, setBioSamples] = useState([{ sampleCode: "", sampleType: "", organismName: "", collectionDate: "", collectionSite: "", remarks: "" }]);
  const [bioDatasets, setBioDatasets] = useState([{ datasetName: "", dataType: "", fileFormat: "", fileSize: "", accessionNo: "", uploadDate: "", isRawData: false, file: null }]);
  const [bioTools, setBioTools] = useState([{ toolName: "", toolVersion: "", purpose: "", parameters: "", referenceDatabase: "", dateUsed: "" }]);

  const addAuthor = () => setAuthors([...authors, { name: "", email: "", department: "" }]);
  const deleteAuthor = (i) => setAuthors(authors.filter((_, idx) => idx !== i));
  const updateAuthor = (i, field, value) => { const u = [...authors]; u[i][field] = value; setAuthors(u); };

  const fetchSuggestions = (index, q) => {
    const token = localStorage.getItem("token");
    if (!token || !q || q.trim().length < 2) {
      setAuthorSuggestions((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/users/search?q=${encodeURIComponent(q.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setAuthorSuggestions((prev) => ({
          ...prev,
          [index]: Array.isArray(data.users) ? data.users : [],
        }));
      } catch {
        setAuthorSuggestions((prev) => ({ ...prev, [index]: [] }));
      }
    }, 250);
  };

  const chooseSuggestion = (index, user) => {
    const u = [...authors];
    u[index] = {
      ...u[index],
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
    };
    setAuthors(u);
    setAuthorSuggestions((prev) => ({ ...prev, [index]: [] }));
    setActiveSuggestIndex(null);
  };

  useEffect(() => {
    return () => window.clearTimeout(debounceRef.current);
  }, []);

  const addSample = () => setBioSamples([...bioSamples, { sampleCode: "", sampleType: "", organismName: "", collectionDate: "", collectionSite: "", remarks: "" }]);
  const deleteSample = (i) => setBioSamples(bioSamples.filter((_, idx) => idx !== i));
  const updateSample = (i, field, value) => { const u = [...bioSamples]; u[i][field] = value; setBioSamples(u); };

  const addDataset = () => setBioDatasets([...bioDatasets, { datasetName: "", dataType: "", fileFormat: "", fileSize: "", accessionNo: "", uploadDate: "", isRawData: false, file: null }]);
  const deleteDataset = (i) => setBioDatasets(bioDatasets.filter((_, idx) => idx !== i));
  const updateDataset = (i, field, value) => { const u = [...bioDatasets]; u[i][field] = value; setBioDatasets(u); };

  const addTool = () => setBioTools([...bioTools, { toolName: "", toolVersion: "", purpose: "", parameters: "", referenceDatabase: "", dateUsed: "" }]);
  const deleteTool = (i) => setBioTools(bioTools.filter((_, idx) => idx !== i));
  const updateTool = (i, field, value) => { const u = [...bioTools]; u[i][field] = value; setBioTools(u); };

  const handleSubmit = () => {
    if (!title.trim()) { showModal("Research title is required."); return; }
    if (!abstract.trim()) { showModal("Abstract is required."); return; }
    if (!studyFile && !existingDocs.length) { showModal("Please upload a research document."); return; }
    if (authors.some((a) => !a.name.trim() || !a.email.trim())) { showModal("All authors must have a name and email."); return; }

    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);

    const token = localStorage.getItem("token");

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 15);
    const deadlineStr = deadlineDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    if (!token) {
      const newStudy = {
        id: Date.now(),
        title,
        abstract,
        authorList: authors,
        status: "Under Review",
        deadline: deadlineStr,
        hru: `HRU-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
        department: authors[0]?.department || "—",
        submittedBy: authors[0]?.name || "—",
        dateCreated: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        bioinformatics: hasBio ? { results: bioResults, samples: bioSamples, datasets: bioDatasets, tools: bioTools } : null,
        documents: studyFile ? [{ name: studyFile.name, uploadedAt: new Date().toLocaleDateString() }] : [],
        reviews: [],
        history: [{ action: "Study submitted", by: authors[0]?.name || "—", date: new Date().toLocaleDateString() }],
      };

      const existing = JSON.parse(localStorage.getItem("studies") || "[]");
      localStorage.setItem("studies", JSON.stringify([...existing, newStudy]));
      navigate("/studies");
      return;
    }

    try {
      const url = isEditMode ? `http://localhost:5000/api/studies/${id}` : "http://localhost:5000/api/studies";
      const method = isEditMode ? "PUT" : "POST";
      const payload = {
        title: title.trim(),
        abstract: abstract.trim(),
        deadline: deadlineStr,
        authorIds: authors.map((author) => author.id).filter(Boolean),
        documents: studyFile
          ? [{ name: studyFile.name, fileType: studyFile.type || "" }]
          : [],
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit study");

      navigate("/studies");
    } catch (err) {
      showModal(err?.message || "Failed to submit study. Please try again.");
    }
  };

  const handleDraft = () => {
    if (!title.trim()) {
      showModal("Please enter a title before saving as draft.");
      return;
    }

    const draftStudy = {
      id: Date.now(),
      title,
      abstract,
      authorList: authors,
      status: "Draft",
      hru: `HRU-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
      department: authors[0]?.department || "—",
      submittedBy: authors[0]?.name || "—",
      dateCreated: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      bioinformatics: hasBio ? { results: bioResults, samples: bioSamples, datasets: bioDatasets, tools: bioTools } : null,
      documents: studyFile ? [{ name: studyFile.name, uploadedAt: new Date().toLocaleDateString() }] : [],
      reviews: [],
      history: [{ action: "Draft saved", by: authors[0]?.name || "—", date: new Date().toLocaleDateString() }],
    };

    const existing = JSON.parse(localStorage.getItem("studies") || "[]");
    localStorage.setItem("studies", JSON.stringify([...existing, draftStudy]));

    navigate("/studies");
  };

  return (
    <div className={styles.page}>

      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(id ? `/studies/${id}` : "/studies")}
        >
          <i className="bi bi-arrow-left"></i> Back
        </button>
        <h2>{isEditMode ? "Edit Research Study" : "Add New Research Study"}</h2>
      </div>

      <div className={styles.mainBox}>

        <div className={styles.subBox}>
          <h3>BASIC INFORMATION</h3>
          <div className={styles.field}>
            <label>Research Title *</label>
            <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Abstract *</label>
            <textarea className={styles.textarea} value={abstract} onChange={(e) => setAbstract(e.target.value)} />
          </div>
          <div className={styles.uploadWrapper}>
            <label className={styles.uploadBox}>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setStudyFile(e.target.files[0])} className={styles.hiddenInput} />
              <div className={styles.uploadContent}>
                <i className="bi bi-cloud-arrow-up"></i>
                <span>
                  {studyFile
                    ? studyFile.name
                    : existingDocs.length > 0
                    ? `Existing: ${existingDocs[0].name}`
                    : "Click to upload research paper"}
                </span>
                <small>PDF or DOCX (max 20MB)</small>
              </div>
            </label>
            {studyFile && (
              <div className={styles.filePreview}>
                <i className="bi bi-file-earmark-text"></i>
                <span>{studyFile.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.subBox}>
          <h3>AUTHORS & CO-AUTHORS</h3>
          {authors.map((author, index) => (
            <div key={index} className={styles.authorCard}>
              {index !== 0 && (
                <i className={`bi bi-trash ${styles.trashIcon}`} onClick={() => deleteAuthor(index)}></i>
              )}
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>Name *</label>
                  <input
                    className={styles.input}
                    value={author.name}
                    onChange={(e) => {
                      updateAuthor(index, "name", e.target.value);
                      fetchSuggestions(index, e.target.value);
                      setActiveSuggestIndex(index);
                    }}
                    onFocus={() => setActiveSuggestIndex(index)}
                    onBlur={() => {
                      setTimeout(() => {
                        setAuthorSuggestions((prev) => ({ ...prev, [index]: [] }));
                        setActiveSuggestIndex(null);
                      }, 150);
                    }}
                    autoComplete="off"
                  />
                  {activeSuggestIndex === index &&
                    (authorSuggestions[index]?.length ?? 0) > 0 && (
                      <div className={styles.suggestions}>
                        {authorSuggestions[index].map((u) => (
                          <div
                            key={u.id}
                            className={styles.suggestionItem}
                            onMouseDown={() => chooseSuggestion(index, u)}
                          >
                            <div className={styles.suggestionName}>{u.name}</div>
                            <div className={styles.suggestionMeta}>
                              {u.email} {u.department ? `• ${u.department}` : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                <div className={styles.field}>
                  <label>Email *</label>
                  <input className={styles.input} value={author.email}
                    onChange={(e) => updateAuthor(index, "email", e.target.value)} />
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label>Department (optional)</label>
                  <input className={styles.input} value={author.department}
                    onChange={(e) => updateAuthor(index, "department", e.target.value)} />
                </div>
              </div>
              {index === 0 && <span className={styles.youBadge}>You</span>}
            </div>
          ))}
          <button className={styles.addAuthor} onClick={addAuthor}>+ Add Co-author</button>
        </div>

        <div className={styles.subBox}>
          <h3>BIOINFORMATICS DATA (OPTIONAL)</h3>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={hasBio} onChange={() => setHasBio(!hasBio)} />
            This study has bioinformatics data
          </label>

          {hasBio && (
            <div className={styles.bioFields}>
              <h4 className={styles.bioSectionTitle}>Results</h4>
              <div className={styles.grid}>
                {[["organismName","Organism Name"],["studyType","Study Type"],["dataType","Data Type"],["databaseSource","Database Source"],["softwareTool","Software Tool Used"],["fileFormat","File Format"],["accessionNo","Accession No"],["sequenceType","Sequence Type"]].map(([field, label]) => (
                  <div className={styles.field} key={field}>
                    <label>{label}</label>
                    <input className={styles.input} value={bioResults[field]} onChange={(e) => setBioResults({ ...bioResults, [field]: e.target.value })} />
                  </div>
                ))}
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label>Notes</label>
                  <textarea className={styles.textarea} value={bioResults.notes} onChange={(e) => setBioResults({ ...bioResults, notes: e.target.value })} />
                </div>
              </div>

              <h4 className={styles.bioSectionTitle}>Samples</h4>
              {bioSamples.map((sample, i) => (
                <div key={i} className={styles.authorCard}>
                  <i className={`bi bi-trash ${styles.trashIcon}`} onClick={() => deleteSample(i)}></i>
                  <div className={styles.grid}>
                    {[["sampleCode","Sample Code"],["sampleType","Sample Type"],["organismName","Organism Name"],["collectionDate","Collection Date"],["collectionSite","Collection Site"]].map(([field, label]) => (
                      <div className={styles.field} key={field}>
                        <label>{label}</label>
                        <input className={styles.input} type={field === "collectionDate" ? "date" : "text"} value={sample[field]} onChange={(e) => updateSample(i, field, e.target.value)} />
                      </div>
                    ))}
                    <div className={`${styles.field} ${styles.fullWidth}`}>
                      <label>Remarks</label>
                      <textarea className={styles.textarea} value={sample.remarks} onChange={(e) => updateSample(i, "remarks", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button className={styles.addAuthor} onClick={addSample}>+ Add Sample</button>

              <h4 className={styles.bioSectionTitle}>Datasets</h4>
              {bioDatasets.map((dataset, i) => (
                <div key={i} className={styles.authorCard}>
                  <i className={`bi bi-trash ${styles.trashIcon}`} onClick={() => deleteDataset(i)}></i>
                  <div className={styles.grid}>
                    {[["datasetName","Dataset Name"],["dataType","Data Type"],["fileFormat","File Format"],["fileSize","File Size"],["accessionNo","Accession No"],["uploadDate","Upload Date"]].map(([field, label]) => (
                      <div className={styles.field} key={field}>
                        <label>{label}</label>
                        <input className={styles.input} type={field === "uploadDate" ? "date" : "text"} value={dataset[field]} onChange={(e) => updateDataset(i, field, e.target.value)} />
                      </div>
                    ))}
                    <div className={`${styles.field} ${styles.fullWidth}`}>
                      <label>Upload File</label>
                      <input type="file" className={styles.fileInput} onChange={(e) => updateDataset(i, "file", e.target.files[0])} />
                      {dataset.file && <span className={styles.fileName}>{dataset.file.name}</span>}
                    </div>
                    <div className={`${styles.field} ${styles.fullWidth}`}>
                      <label className={styles.checkbox}>
                        <input type="checkbox" checked={dataset.isRawData} onChange={(e) => updateDataset(i, "isRawData", e.target.checked)} />
                        Is Raw Data
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <button className={styles.addAuthor} onClick={addDataset}>+ Add Dataset</button>

              <h4 className={styles.bioSectionTitle}>Tools</h4>
              {bioTools.map((tool, i) => (
                <div key={i} className={styles.authorCard}>
                  <i className={`bi bi-trash ${styles.trashIcon}`} onClick={() => deleteTool(i)}></i>
                  <div className={styles.grid}>
                    {[["toolName","Tool Name"],["toolVersion","Tool Version"],["purpose","Purpose"],["parameters","Parameters"],["referenceDatabase","Reference Database"],["dateUsed","Date Used"]].map(([field, label]) => (
                      <div className={styles.field} key={field}>
                        <label>{label}</label>
                        <input className={styles.input} type={field === "dateUsed" ? "date" : "text"} value={tool[field]} onChange={(e) => updateTool(i, field, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button className={styles.addAuthor} onClick={addTool}>+ Add Tool</button>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.draft} onClick={handleDraft}>Save as Draft</button>
          <button className={styles.submit} onClick={handleSubmit}>Submit for Review</button>
        </div>

      </div>

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

      {showConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Submit for Review?</h3>
            <p>Once submitted, the study will be sent for review. Are you sure?</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={confirmSubmit}>Yes, Submit</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default NewStudy;