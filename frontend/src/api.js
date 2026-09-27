import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// Dashboard
export const getDashboard = () => api.get('/api/dashboard');

// Patients
export const getPatients = (search) =>
  api.get('/api/patients', { params: search ? { search } : {} });
export const getPatient = (id) => api.get(`/api/patients/${id}`);
export const createPatient = (data) => api.post('/api/patients', data);
export const updatePatient = (id, data) => api.put(`/api/patients/${id}`, data);

// Appointments
export const getAppointments = (filters) =>
  api.get('/api/appointments', { params: filters });
export const createAppointment = (data) => api.post('/api/appointments', data);
export const updateAppointmentStatus = (id, status) =>
  api.patch(`/api/appointments/${id}/status`, { status });

// Emergency Cases
export const getEmergencyCases = (status) =>
  api.get('/api/emergency-cases', { params: status ? { status } : {} });
export const getEmergencyCase = (id) => api.get(`/api/emergency-cases/${id}`);
export const createEmergencyCase = (data) => api.post('/api/emergency-cases', data);
export const updateCaseStatus = (id, data) =>
  api.patch(`/api/emergency-cases/${id}/status`, data);

// Ambulance
export const getAvailableAmbulances = () => api.get('/api/ambulances/available');
export const getAmbulances = (caseId) =>
  api.get('/api/ambulances', { params: caseId ? { case_id: caseId } : {} });
export const requestAmbulance = (data) => api.post('/api/ambulances/request', data);
export const updateAmbulanceStatus = (reqId, data) =>
  api.patch(`/api/ambulances/${reqId}/status`, data);

// Blood
export const searchBloodSources = (filters) =>
  api.get('/api/blood/sources', { params: filters });
export const createBloodRequest = (data) => api.post('/api/blood/request', data);
export const updateBloodStatus = (reqId, data) =>
  api.patch(`/api/blood/request/${reqId}/status`, data);

// Facilities
export const getFacilities = () => api.get('/api/facilities');
export const contactFacility = (data) => api.post('/api/facilities/contact', data);
export const updateFacilityStatus = (data) => api.post('/api/facilities/update-status', data);

// Timeline
export const getCaseTimeline = (caseId) => api.get(`/api/cases/${caseId}/timeline`);
export const addCaseEvent = (caseId, data) => api.post(`/api/cases/${caseId}/events`, data);

// Analytics
export const getAnalytics = () => api.get('/api/analytics');
