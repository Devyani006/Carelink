import { useEffect, useState } from 'react';
import { getAppointments, createAppointment, updateAppointmentStatus, getPatients } from '../api';
import { Calendar, Search, Plus, X, AlertTriangle, Filter } from 'lucide-react';
import { useToast } from '../ToastContext';
import { apptStatusBadge, formatDate } from '../utils';

const STATUSES = ['BOOKED', 'CHECKED-IN', 'WAITING', 'IN-CONSULTATION', 'COMPLETED', 'CANCELLED'];
const DEPARTMENTS = ['Cardiology', 'Orthopedics', 'General Medicine', 'Neurology', 'Emergency', 'Radiology', 'Pediatrics', 'Oncology'];
const DOCTORS = ['Dr. Anand Kumar', 'Dr. Preethi Shetty', 'Dr. Rajesh Nair', 'Dr. Kavitha Menon', 'Dr. Suresh Babu', 'Dr. Meera Krishnan'];

const NEXT_STATUS = {
  BOOKED: 'CHECKED-IN',
  'CHECKED-IN': 'WAITING',
  WAITING: 'IN-CONSULTATION',
  'IN-CONSULTATION': 'COMPLETED',
};

export default function Appointments() {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAppointments({ search: search || undefined, status: filterStatus || undefined });
      setAppts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, filterStatus]);

  const handleStatusUpdate = async (id, status) => {
    try {
      const updated = await updateAppointmentStatus(id, status);
      setAppts((prev) => prev.map((a) => a.id === id ? { ...a, ...updated } : a));
      toast(`Status updated to ${status}`, 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const handleAdded = (a) => {
    setAppts((prev) => [a, ...prev]);
    setShowAdd(false);
    toast('Appointment booked', 'success');
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <div className="page-title">Appointments</div>
            <div className="page-subtitle">{appts.length} appointments</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Book Appointment
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <Search size={15} />
            <input
              className="form-input search-input"
              placeholder="Search patient, doctor, department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select
              className="form-select"
              style={{ paddingLeft: 30, width: 180 }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="alert alert-danger mb-4"><AlertTriangle size={14} /> {error}</div>}

        {loading ? (
          <div className="skeleton" style={{ height: 300 }} />
        ) : appts.length === 0 ? (
          <div className="empty-state">
            <Calendar size={40} />
            <h3>No appointments found</h3>
            <p>Book an appointment to get started.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor / Dept</th>
                    <th>Date &amp; Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.full_name}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{a.doctor || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.department || '—'}</div>
                      </td>
                      <td>
                        <div>{formatDate(a.date)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.time}</div>
                      </td>
                      <td style={{ maxWidth: 150 }}>{a.reason || '—'}</td>
                      <td><span className={apptStatusBadge(a.status)}>{a.status}</span></td>
                      <td>
                        {NEXT_STATUS[a.status] && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStatusUpdate(a.id, NEXT_STATUS[a.status])}
                          >
                            → {NEXT_STATUS[a.status]}
                          </button>
                        )}
                        {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ marginLeft: 4 }}
                            onClick={() => handleStatusUpdate(a.id, 'CANCELLED')}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddAppointmentModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />}
    </div>
  );
}

function AddAppointmentModal({ onClose, onAdded }) {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patient_id: '', doctor: '', department: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00', reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [pSearch, setPSearch] = useState('');

  useEffect(() => {
    getPatients().then(setPatients).catch(() => {});
  }, []);

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(pSearch.toLowerCase())
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.patient_id) { setErr('Select a patient'); return; }
    if (!form.date || !form.time) { setErr('Date and time are required'); return; }
    setSaving(true); setErr('');
    try {
      const a = await createAppointment({ ...form, patient_id: parseInt(form.patient_id) });
      onAdded(a);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Book Appointment</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body">
          {err && <div className="alert alert-danger mb-3" style={{ marginBottom: 12 }}><AlertTriangle size={14} /> {err}</div>}

          <div className="form-group">
            <label className="form-label">Patient *</label>
            <input
              className="form-input mb-2"
              placeholder="Search patient…"
              value={pSearch}
              onChange={e => setPSearch(e.target.value)}
              style={{ marginBottom: 6 }}
            />
            <select
              className="form-select"
              value={form.patient_id}
              onChange={e => set('patient_id', e.target.value)}
              size={4}
              style={{ height: 'auto' }}
            >
              <option value="">— select —</option>
              {filtered.map(p => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.blood_group || 'N/A'})</option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Doctor</label>
              <select className="form-select" value={form.doctor} onChange={e => set('doctor', e.target.value)}>
                <option value="">Select doctor</option>
                {DOCTORS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">Select dept</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Time *</label>
              <input className="form-input" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Visit</label>
            <input className="form-input" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="e.g. Routine checkup, Follow-up" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Booking…' : 'Book Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}
