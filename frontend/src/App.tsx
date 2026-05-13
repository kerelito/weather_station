import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AlertsPage } from "./pages/AlertsPage";
import { ApiDocsPage } from "./pages/ApiDocsPage";
import { ChartsPage } from "./pages/ChartsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { MeasurementsPage } from "./pages/MeasurementsPage";
import { SensorDetailPage } from "./pages/SensorDetailPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/charts" element={<ChartsPage />} />
        <Route path="/measurements" element={<MeasurementsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/api-docs" element={<ApiDocsPage />} />
        <Route path="/sensors/:id" element={<SensorDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
