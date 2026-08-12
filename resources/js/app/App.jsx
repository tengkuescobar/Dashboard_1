import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardOverview from "./pages/DashboardOverview";
import DashboardRevenue from "./pages/DashboardRevenue";
import DashboardBroadband from "./pages/DashboardBroadband";
import DashboardDrivers from "./pages/DashboardDrivers";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="revenue" element={<DashboardRevenue />} />
          <Route path="broadband" element={<DashboardBroadband />} />
          <Route path="drivers" element={<DashboardDrivers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
