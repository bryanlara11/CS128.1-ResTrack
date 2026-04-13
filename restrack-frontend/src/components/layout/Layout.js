import React from "react";
import { Outlet, Link } from "react-router-dom";
import "./Layout.css";
import restrackLogo from "../../assets/restrack_logo.png";

function Layout() {
  return (
    <div>
      <div className="navbar">
        <div className="nav-left">
          <img src={restrackLogo} alt="logo" className="nav-logo" />
          <h2 className="nav-title">ResTrack</h2>
          <i className="bi bi-square-half"></i> 
          <Link to="/dashboardresearcher" className="nav-link">Dashboard</Link>
          <i className="bi bi-list-ul"></i>
          <Link to="/studies" className="nav-link">Your Studies</Link>
        </div>

        <div className="nav-right">
            <button className="new-study-button">+ New Study</button>
          <div className="userInfo">
          <span className="userName">James Wilson</span>
          <span className="userRole">Researcher</span>
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