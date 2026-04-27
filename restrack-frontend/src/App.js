import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/pages/Login";
import Signup from "./components/pages/Signup";
import Layout from "./components/layout/Layout";
import DashboardResearcher from "./components/pages/DashboardResearcher";
import Studies from "./components/pages/Studies";
import NewStudy from "./components/pages/NewStudy";
import SpecificStudy from "./components/pages/SpecificStudy";
import DashboardReviewer from "./components/pages/DashboardReviewer";
import Assignments from "./components/pages/Assignments";
import AssignedStudy from "./components/pages/AssignedStudy";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Layout />}>
        <Route path="/dashboardresearcher" element={<DashboardResearcher />} />
        <Route path="/studies" element={<Studies />} />
        <Route path="/newstudy" element={<NewStudy />} />
        <Route path="/dashboardreviewer" element={<DashboardReviewer />} />
        <Route path="/studies/:id/edit" element={<NewStudy />} />
        <Route path="/studies/:id" element={<SpecificStudy />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/assignments/:id" element={<AssignedStudy />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;