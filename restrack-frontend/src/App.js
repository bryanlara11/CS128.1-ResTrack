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
import DashboardTRB from "./components/pages/DashboardTRB";
import AssignmentsTRB from "./components/pages/AssignmentsTRB";
import AssignedStudyTRB from "./components/pages/AssignedStudyTRB";
import DashboardAdmin from "./components/pages/DashboardAdmin";


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
          <Route path="/studies/:id/edit" element={<NewStudy />} />
          <Route path="/studies/:id" element={<SpecificStudy />} />

          <Route path="/dashboardreviewer" element={<DashboardReviewer />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/assignments/:id" element={<AssignedStudy />} />

          <Route path="/dashboardtrb" element={<DashboardTRB />} />
          <Route path="/trb-chair/assignments" element={<AssignmentsTRB />} />
          <Route path="/trb-chair/assignments/:id" element={<AssignedStudyTRB />} />

          <Route path="/dashboardadmin" element={<DashboardAdmin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;