import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { ToastProvider } from './ToastContext';

import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import EmergencyCommandCenter from './pages/EmergencyCommandCenter';
import CreateEmergencyCase from './pages/CreateEmergencyCase';
import EmergencyCaseDetail from './pages/EmergencyCaseDetail';
import AmbulancePage from './pages/AmbulancePage';
import BloodCoordination from './pages/BloodCoordination';
import Facilities from './pages/Facilities';
import Analytics from './pages/Analytics';

function AppLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Landing / Welcome Page without Sidebar */}
          <Route path="/" element={<Welcome />} />

          {/* Operational Application Routes with White Sidebar */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/emergency" element={<EmergencyCommandCenter />} />
            <Route path="/emergency/new" element={<CreateEmergencyCase />} />
            <Route path="/emergency/:id" element={<EmergencyCaseDetail />} />
            <Route path="/ambulance" element={<AmbulancePage />} />
            <Route path="/blood" element={<BloodCoordination />} />
            <Route path="/facilities" element={<Facilities />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
