import { useEffect, useState } from 'react';
import { getAppointments, createAppointment, updateAppointmentStatus, getPatients } from '../api';
import { Calendar, Search, Plus, X, AlertTriangle, Filter, ChevronRight, Check, UserCheck, Stethoscope } from 'lucide-react';
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
      toast(`Appointment status: ${status}`, 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const handleAdded = (a) => {
    setAppts((prev) => [a, ...prev]);
    setShowAdd(false);
    toast('Appointment successfully booked', 'success');
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="page-title">
              <Calendar size={22} color="var(--color-slate)" strokeWidth={2.4} />
              Appointment Schedule
            </div>
            <div className="page-subtitle">{appts.length} clinical appointments across outpatient &amp; inpatient departments</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} strokeWidth={2.5} /> Schedule Appointment
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              className="form-input search-input"
              placeholder="Search by patient name, doctor or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Filter size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select
              className="form-select"
              style={{ paddingLeft: 34, width: 180 }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 18 }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="skeleton" style={{ height: 320 }} />
        ) : appts.length === 0 ? (
          <div className="empty-state">
            <Calendar size={40} color="var(--color-slate)" />
            <h3>No appointments found</h3>
            <p>Try adjusting your search criteria or schedule a new patient appointment.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Patient Identification</th>
                    <th>Attending Doctor</th>
                    <th>Clinical Department</th>
                    <th>Consultation Reason</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Workflow Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>{formatDate(a.date)}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>{a.time}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{a.patient_name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Patient ID: #{a.patient_id}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.doctor}</td>
                      <td>
                        <span className="badge badge-stone">{a.department}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.reason || 'General Consultation'}
                        </div>
                      </td>
                      <td>
                        <span className={apptStatusBadge(a.status)}>{a.status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {NEXT_STATUS[a.status] ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStatusUpdate(a.id, NEXT_STATUS[a.status])}
                            style={{ fontSize: 12, fontWeight: 700 }}
                          >
                            Mark {NEXT_STATUS[a.status]} <ChevronRight size={13} />
                          </button>
                        ) : a.status === 'COMPLETED' ? (
                          <span style={{ fontSize: 12, color: 'var(--color-success-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Check size={14} /> Completed
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
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

      {showAdd && <BookAppointmentModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />}
    </div>
  );
}

function BookAppointmentModal({ onClose, onAdded }) {
  const [patients, setPatients] = useState([]);
  const [pSearch, setPSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    doctor: DOCTORS[0],
    department: DEPARTMENTS[0],
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const searchPatients = async (q) => {
    if (!q) { setPatients([]); return; }
    try {
      setPatients(await getPatients(q));
    } catch (e) {}
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!selectedPatient) { setErr('Please select a patient for this appointment'); return; }
    if (!form.date) { setErr('Date is required'); return; }
    setSaving(true);
    setErr('');
    try {
      const a = await createAppointment({
        patient_id: selectedPatient.id,
        date: form.date,
        time: form.time,
        doctor: form.doctor,
        department: form.department,
        reason: form.reason,
      });
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
          <span className="modal-title">
            <Calendar size={18} color="var(--brand-red)" strokeWidth={2.4} /> Schedule Patient Appointment
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={14} />
          </button>
        </div>
        <div className="modal-body">
          {err && (
            <div className="alert alert-danger" style={{ marginBottom: 14 }}>
              <AlertTriangle size={15} /> {err}
            </div>
          )}

          {/* Patient Selection */}
          <div className="form-group">
            <label className="form-label">Patient Record *</label>
            {selectedPatient ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '12px 16px'
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>{selectedPatient.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Patient ID: #{selectedPatient.id} · {selectedPatient.phone || 'No contact'}</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPatient(null)}>
                  Change
                </button>
              </div>
            ) : (
              <div>
                <div className="search-wrap" style={{ marginBottom: 6 }}>
                  <Search size={15} />
                  <input
                    className="form-input search-input"
                    placeholder="Search patient by name or phone..."
                    value={pSearch}
                    onChange={e => { setPSearch(e.target.value); searchPatients(e.target.value); }}
                  />
                </div>
                {patients.length > 0 && (
                  <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', maxHeight: 160, overflowY: 'auto', background: 'var(--bg-card)' }}>
                    {patients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedPatient(p); setPatients([]); }}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{p.full_name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{p.gender}, {p.age}y · {p.phone || ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time Slot *</label>
              <input
                className="form-input"
                value={form.time}
                onChange={e => set('time', e.target.value)}
                placeholder="e.g. 10:30 AM"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                value={form.department}
                onChange={e => set('department', e.target.value)}
              >
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Attending Doctor *</label>
              <select
                className="form-select"
                value={form.doctor}
                onChange={e => set('doctor', e.target.value)}
              >
                {DOCTORS.map(doc => <option key={doc}>{doc}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Chief Complaint / Reason for Visit</label>
            <input
              className="form-input"
              value={form.reason}
              onChange={e => set('reason', e.target.value)}
              placeholder="e.g. Post-surgery review, ECG evaluation"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Booking…' : 'Confirm Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}
