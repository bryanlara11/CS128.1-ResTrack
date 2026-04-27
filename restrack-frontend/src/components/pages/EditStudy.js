import React, { useState, useEffect } from "react";
import styles from "./NewStudy.module.css";
import { useNavigate, useParams } from "react-router-dom";

function EditStudy() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [hasBio, setHasBio] = useState(false);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [studyFile, setStudyFile] = useState(null);
  const [authors, setAuthors] = useState([{ name: "", email: "", department: "" }]);
  const [bioResults, setBioResults] = useState({ organismName: "", studyType: "", dataType: "", databaseSource: "", softwareTool: "", fileFormat: "", accessionNo: "", sequenceType: "", notes: "" });
  const [bioSamples, setBioSamples] = useState([{ sampleCode: "", sampleType: "", organismName: "", collectionDate: "", collectionSite: "", remarks: "" }]);
  const [bioDatasets, setBioDatasets] = useState([{ datasetName: "", dataType: "", fileFormat: "", fileSize: "", accessionNo: "", uploadDate: "", isRawData: false, file: null }]);
  const [bioTools, setBioTools] = useState([{ toolName: "", toolVersion: "", purpose: "", parameters: "", referenceDatabase: "", dateUsed: "" }]);
  const [showConfirm, setShowConfirm] = useState(false);

  // pre-fill fields from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("studies") || "[]");
    const study = saved.find((s) => s.id === Number(id));
    if (!study) return;

    setTitle(study.title || "");
    setAbstract(study.abstract || "");
    setAuthors(study.authorList || [{ name: "", email: "", department: "" }]);

    if (study.bioinformatics) {
      setHasBio(true);
      setBioResults(study.bioinformatics.results || bioResults);
      setBioSamples(study.bioinformatics.samples || bioSamples);
      setBioDatasets(study.bioinformatics.datasets || bioDatasets);
      setBioTools(study.bioinformatics.tools || bioTools);
    }
  }, [id]);

  const addAuthor = () => setAuthors([...authors, { name: "", email: "", department: "" }]);
  const deleteAuthor = (i) => setAuthors(authors.filter((_, idx) => idx !== i));
  const updateAuthor = (i, field, value) => { const u = [...authors]; u[i][field] = value; setAuthors(u); };

  const addSample = () => setBioSamples([...bioSamples, { sampleCode: "", sampleType: "", organismName: "", collectionDate: "", collectionSite: "", remarks: "" }]);
  const deleteSample = (i) => setBioSamples(bioSamples.filter((_, idx) => idx !== i));
  const updateSample = (i, field, value) => { const u = [...bioSamples]; u[i][field] = value; setBioSamples(u); };

  const addDataset = () => setBioDatasets([...bioDatasets, { datasetName: "", dataType: "", fileFormat: "", fileSize: "", accessionNo: "", uploadDate: "", isRawData: false, file: null }]);
  const deleteDataset = (i) => setBioDatasets(bioDatasets.filter((_, idx) => idx !== i));
  const updateDataset = (i, field, value) => { const u = [...bioDatasets]; u[i][field] = value; setBioDatasets(u); };

  const addTool = () => setBioTools([...bioTools, { toolName: "", toolVersion: "", purpose: "", parameters: "", referenceDatabase: "", dateUsed: "" }]);
  const deleteTool = (i) => setBioTools(bioTools.filter((_, idx) => idx !== i));
  const updateTool = (i, field, value) => { const u = [...bioTools]; u[i][field] = value; setBioTools(u); };

  const handleSave = () => {
    if (!title.trim()) { alert("Research title is required."); return; }
    if (!abstract.trim()) { alert("Abstract is required."); return; }
    if (authors.some((a) => !a.name.trim() || !a.email.trim())) { alert("All authors must have a name and email."); return; }
    setShowConfirm(true);
  };

  const confirmSave = () => {
    setShowConfirm(false);

    const saved = JSON.parse(localStorage.getItem("studies") || "[]");
    const updated = saved.map((s) =>
      s.id === Number(id)
        ? {
            ...s,
            title,
            abstract,
            authorList: authors,
            department: authors[0]?.department || s.department,
            date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            bioinformatics: hasBio ? { results: bioResults, samples: bioSamples, datasets: bioDatasets, tools: bioTools } : null,
            documents: studyFile ? [...(s.documents || []), { name: studyFile.name, uploadedAt: new Date().toLocaleDateString() }] : s.documents,
            history: [...(s.history || []), { action: "Study edited", by: authors[0]?.name || "—", date: new Date().toLocaleDateString() }],
          }
        : s
    );

    localStorage.setItem("studies", JSON.stringify(updated));
    navigate(`/studies/${id}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h2>Edit Research Study</h2>
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
                <span>{studyFile ? "Change file" : "Upload new document (optional)"}</span>
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
                  <input className={styles.input} value={author.name} onChange={(e) => updateAuthor(index, "name", e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label>Email *</label>
                  <input className={styles.input} value={author.email} onChange={(e) => updateAuthor(index, "email", e.target.value)} />
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label>Department (optional)</label>
                  <input className={styles.input} value={author.department} onChange={(e) => updateAuthor(index, "department", e.target.value)} />
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
          <button className={styles.draft} onClick={() => navigate(`/studies/${id}`)}>Cancel</button>
          <button className={styles.submit} onClick={handleSave}>Save Changes</button>
        </div>

      </div>

      {showConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Save Changes?</h3>
            <p>Are you sure you want to save changes to this study?</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={confirmSave}>Yes, Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditStudy;