import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Login.module.css";
import restrackLogo from "../../assets/restrack_logo.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === "admin@example.com" && password === "1234") {
      navigate("/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.containerWithin}>
        <div className={styles.header}>
          <img src={restrackLogo} alt="Logo" className={styles.logo} />
          <h2 className={styles.systemName}>ResTrack</h2>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.signin}>SIGN IN</h2>

          <label htmlFor="email">Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />

          <button type="submit" className={styles.button}>Sign in</button>

          <p className={styles.p}>
            Don't have an account? <Link to="/signup"> Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;