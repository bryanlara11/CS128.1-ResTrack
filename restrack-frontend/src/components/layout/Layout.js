import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import "./Layout.css";
import restrackLogo from "../../assets/restrack_logo.png";

function Layout() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : "User";

  const isReviewer = location.pathname.startsWith("/dashboardreviewer") || location.pathname.startsWith("/assignments");
  const isResearcher = !isReviewer;
  const roleLabel = isReviewer ? "Reviewer" : "Researcher";

  const notifications = [];

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
            to={isReviewer ? "/dashboardreviewer" : "/dashboardresearcher"}
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
                <h4 className="notifTitle">Notifications</h4>
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