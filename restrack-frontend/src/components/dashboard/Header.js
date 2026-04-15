import React from "react";
import styles from "./Header.module.css";

function Header() {
  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : "User";

  return (
    <div className={styles.header}>
      <h2>Welcome, {displayName}!</h2>
    </div>
  );
}

export default Header;