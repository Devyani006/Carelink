import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { ToastProvider } from './ToastContext';

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

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
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
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
