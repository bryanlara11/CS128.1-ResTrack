import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
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

  const role = user.role_name;

  const isTRB = role === "TRB";
  const isReviewer = role === "Reviewer";
  const isResearcher = role === "Researcher";
  const isAdmin = role === "Admin";

  const roleLabel = {
    Researcher: "Researcher",
    Reviewer: "Reviewer",
    TRB: "TRB Chair",
    Admin: "Admin",
  }[role] || "User";

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      }
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  const deleteNotif = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.filter((n) => n.notification_id !== id));
    } catch (err) {
      console.error("Error marking notification read", err);
    }
  };

  const clearAllNotifs = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
    } catch (err) {
      console.error("Error clearing notifications", err);
    }
  };

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
            to={
              isAdmin ? "/dashboardadmin" :
              isTRB ? "/dashboardtrb" :
              isReviewer ? "/dashboardreviewer" :
              "/dashboardresearcher"
            }
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

          {isTRB && (
            <NavLink to="/trb-chair/assignments" className={({ isActive }) => isActive ? "navItem active" : "navItem"}>
              <i className="bi bi-clipboard-check"></i>Assignments
            </NavLink>
          )}

          {isAdmin && (
            <>
              <NavLink to="/admin/manage-users" className={({ isActive }) => isActive ? "navItem active" : "navItem"}>
                <i className="bi bi-people"></i>Manage Users
              </NavLink>
              <NavLink to="/admin/review-queue" className={({ isActive }) => isActive ? "navItem active" : "navItem"}>
                <i className="bi bi-journals"></i>Review Queue
              </NavLink>
            </>
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
                    <button className="notifClear" onClick={clearAllNotifs}>Clear all</button>
                  )}
                </div>
                {notifications.length > 0 ? notifications.map((n) => (
                  <div key={n.notification_id} className="notifItem">
                    <div className="notifItemContent">
                      <p className="notifMessage">{n.message}</p>
                      <span className="notifDate">
                        {new Date(n.date_sent).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <button className="notifDelete" onClick={() => deleteNotif(n.notification_id)}>
                      <i className="bi bi-x"></i>
                    </button>
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