
import React, { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import "./Layout.css";
import restrackLogo from "../../assets/restrack_logo.png";

function Layout() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div>
      <div className="navbar">
        <div className="nav-left">
          <img src={restrackLogo} alt="logo" className="nav-logo" />
          <h2 className="nav-title">ResTrack</h2>
          <Link to="/dashboardresearcher" className={({ isActive }) =>
          isActive ? "navItem active" : "navItem"}>
            Dashboard</Link>
          <Link to="/studies" className={({ isActive }) =>
          isActive ? "navItem active" : "navItem"}>Your Studies</Link>
        </div>

        <div className="nav-right">

            <button className="new-study-button">+ New Study</button>
          <div className="userInfo" onClick={() => setShowDropdown(!showDropdown)}>
            <span className="userName">{displayName}</span>
            <span className="userRole">Researcher</span>
            {showDropdown && (
              <div className="user-dropdown">
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;