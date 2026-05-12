import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "./Layout.css";
import restrackLogo from "../../assets/restrack_logo.png";

function Layout() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : "User";

  const role = user.role_name; // "Admin", "Researcher", "Reviewer", "TRB"

  const isTRB = role === "TRB";
  const isReviewer = role === "Reviewer";
  const isResearcher = role === "Researcher";
  const roleLabel = {
    Researcher: "Researcher",
    Reviewer: "Reviewer",
    TRB: "TRB Chair",
    Admin: "Admin",
  }[role] || "User";

  // Dummy Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Your study HRU-2026-001 has been sent for review.", date: "Apr 25, 2026" },
    { id: 2, message: "Dr. Santos left feedback on your study.", date: "Apr 24, 2026" },
    { id: 3, message: "Your study has been approved.", date: "Apr 20, 2026" },
  ]);

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

          <NavLink
            to={isTRB ? "/dashboardtrb" : isReviewer ? "/dashboardreviewer" : "/dashboardresearcher"}
            className={({ isActive }) => isActive ? "navItem active" : "navItem"}
          >
            <i className="bi bi-square-half"></i>Dashboard
          </NavLink>

          {isResearcher && (
            <NavLink to="/studies" className={({ isActive }) => isActive ? "navItem active" : "navItem"}>
              <i className="bi bi-list-ul"></i>Your Studies
            </NavLink>
          )}

          {isReviewer && (
            <NavLink to="/assignments" className={({ isActive }) => isActive ? "navItem active" : "navItem"}>
              <i className="bi bi-clipboard-check"></i>Assignments
            </NavLink>
          )}
        </div>

        <div className="nav-right">
          {isResearcher && (
            <button className="new-study-button" onClick={() => navigate("/newstudy")}>+ New Study</button>
          )}

          <div className="notifWrapper">
            <div className="notifBell" onClick={() => setShowNotifs(!showNotifs)}>
              <i className="bi bi-bell"></i>
              {notifications.length > 0 && (
                <span className="notifBadge">{notifications.length}</span>
              )}
            </div>

            {showNotifs && (
              <div className="notifDropdown">
                <div className="notifHeader">
                  <h4 className="notifTitle">Notifications</h4>
                  {notifications.length > 0 && (
                    <button className="notifClear" onClick={() => setNotifications([])}>Clear all</button>
                  )}
                </div>
                {notifications.length > 0 ? notifications.map((n) => (
                  <div key={n.id} className="notifItem">
                    <p className="notifMessage">{n.message}</p>
                    <span className="notifDate">{n.date}</span>
                  </div>
                )) : (
                  <p className="notifEmpty">No notifications.</p>
                )}
              </div>
            )}
          </div>

          <div className="userInfo" onClick={() => setShowDropdown(!showDropdown)}>
            <span className="userName">{displayName}</span>
            <span className="userRole">{roleLabel}</span>
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