import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Signup.module.css";
import restrackLogo from "../../assets/restrack_logo.png";

function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      alert("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    alert("Signed up successfully!");
    navigate("/login");
  };

  return (
    <div className={styles.container}>
      <div className={styles.containerWithin}>
        <div className={styles.header}>
          <img src={restrackLogo} alt="Logo" className={styles.logo} />
          <h2 className={styles.systemName}>ResTrack</h2>
        </div>

      <form className={styles.form} onSubmit={handleSubmit}>
  <h2 className={styles.signup}>SIGN UP</h2>

  <div className={styles.formGrid}>
    {/* LEFT COLUMN */}
    <div>
      <label>First Name</label>
      <input
  type="text"
  value={firstName}
  placeholder="First Name"
  onChange={(e) => setFirstName(e.target.value)}
  className={styles.input}
/>

      <label>Last Name</label>
      <input
  type="text"
  value={lastName}
  placeholder="Last Name"
  onChange={(e) => setLastName(e.target.value)}
  className={styles.input}
/>

      <label>Email</label>
      <input
  type="email"
  value={email}
  placeholder="Email"
  onChange={(e) => setEmail(e.target.value)}
  className={styles.input}
/>
    </div>

    {/* RIGHT COLUMN */}
    <div>
      <label>Password</label>
      <input
  type="password"
  value={password}
  placeholder="Password"
  onChange={(e) => setPassword(e.target.value)}
  className={styles.input}
/>

      <label>Confirm Password</label>
      <input
  type="password"
  value={confirmPassword}
  placeholder="Confirm Password"
  onChange={(e) => setConfirmPassword(e.target.value)}
  className={styles.input}
/>
    </div>
  </div>

  <p className={styles.linkText}>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>

  <button className={styles.button}>Sign Up</button>
</form>

          
      </div>
    </div>
  );
}

export default Signup;