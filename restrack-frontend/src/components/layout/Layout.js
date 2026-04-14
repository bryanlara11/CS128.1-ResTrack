import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import "./Layout.css";
import restrackLogo from "../../assets/restrack_logo.png";

function Layout() {
  return (
    <div>
      <div className="navbar">
        <div className="nav-left">
          <img src={restrackLogo} alt="logo" className="nav-logo" />
          <h2 className="nav-title">ResTrack</h2>
          <NavLink to="/dashboardresearcher" className={({ isActive }) =>
          isActive ? "navItem active" : "navItem"}>
            <i className="bi bi-square-half"></i> 
            Dashboard</NavLink>
          <NavLink to="/studies" className={({ isActive }) =>
          isActive ? "navItem active" : "navItem"}>
            <i className="bi bi-list-ul"></i>Your Studies</NavLink>
        </div>

        <div className="nav-right">
          <NavLink to="/newstudy">
            <button className="new-study-button">+ New Study</button></NavLink>
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