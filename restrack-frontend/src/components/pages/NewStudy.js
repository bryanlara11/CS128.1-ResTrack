import React, { useState } from "react";
import styles from "./NewStudy.module.css";
import { useNavigate } from "react-router-dom";

function NewStudy() {
  const navigate = useNavigate();
  const [hasBio, setHasBio] = useState(false);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [department, setDepartment] = useState("");
  const [hraAlignment, setHraAlignment] = useState("");
  const [authors, setAuthors] = useState([{ name: "", email: "", department: "" }]);

  const addAuthor = () => {
    setAuthors([...authors, { name: "", email: "", department: "" }]);
  };

  const deleteAuthor = (indexToRemove) => {
    setAuthors(authors.filter((_, index) => index !== indexToRemove));
  };

  const updateAuthor = (index, field, value) => {
    const updated = [...authors];
    updated[index][field] = value;
    setAuthors(updated);
  };

  const handleSubmit = () => {
    console.log({ title, abstract, department, hraAlignment, authors });
    navigate("/studies");
  };

  const handleDraft = () => {
    console.log({ title, abstract, department, hraAlignment, authors });
    navigate("/studies");
  };

  return (
    <div className={styles.page}>

      <div className={styles.topBar}>
        <h2>Add New Research Study</h2>
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
            <textarea className={styles.textarea} value={abstract} onChange={(e) => setAbstract(e.target.value)}></textarea>
          </div>

        </div>
        <div className={styles.subBox}>
          <h3>AUTHORS & CO-AUTHORS</h3>

          {authors.map((author, index) => (
            <div key={index} className={styles.authorCard}>

              <i
                className={`bi bi-trash ${styles.trashIcon}`}
                onClick={() => deleteAuthor(index)}
              ></i>

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
            </div>
          ))}

          <button className={styles.addAuthor} onClick={addAuthor}>
            + Add Co-author
          </button>
        </div>

        <div className={styles.subBox}>
          <h3>BIOINFORMATICS DATA (OPTIONAL)</h3>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={hasBio}
              onChange={() => setHasBio(!hasBio)}
            />
            This study has bioinformatics data
          </label>

          {hasBio && (
            <div className={styles.bioFields}>
              <div className={styles.field}>
                <label>Organism Name</label>
                <input className={styles.input} />
              </div>
              <div className={styles.field}>
                <label>Accession Number</label>
                <input className={styles.input} />
              </div>
              <div className={styles.field}>
                <label>Sequence Type</label>
                <input className={styles.input} />
              </div>
              <div className={styles.field}>
                <label>Database Source</label>
                <input className={styles.input} />
              </div>
            </div>
          )}
        </div>

      </div>

      <div className={styles.actions}>
        <button className={styles.draft} onClick={handleDraft}>Save as Draft</button>
        <button className={styles.submit} onClick={handleSubmit}>Submit for Review</button>
      </div>

    </div>
  );
}

export default NewStudy;