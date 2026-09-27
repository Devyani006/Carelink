import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatient, updatePatient } from '../api';
import {
  ArrowLeft, Edit3, Save, X, Zap, Calendar,
  Phone, User, Droplets, MapPin, AlertTriangle
} from 'lucide-react';
import { useToast } from '../ToastContext';
import { apptStatusBadge, caseStatusBadge, formatDate, formatDuration, caseStatusLabel } from '../utils';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getPatient(id);
      setPatient(d);
      setForm({
        full_name: d.full_name, age: d.age, gender: d.gender,
        blood_group: d.blood_group, phone: d.phone,
        emergency_contact: d.emergency_contact, address: d.address,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updatePatient(id, form);
      setPatient((p) => ({ ...p, ...updated }));
      setEditing(false);
      toast('Patient updated', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-body" style={{ paddingTop: 24 }}><div className="skeleton" style={{ height: 300 }} /></div>;
  if (error) return <div className="page-header"><div className="alert alert-danger"><AlertTriangle size={14} /> {error}</div></div>;
  if (!patient) return null;

  const upcoming = patient.appointments?.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED') || [];
  const past = patient.appointments?.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED') || [];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/patients')}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="page-title">{patient.full_name}</div>
            <div className="page-subtitle">Patient ID: {patient.id} · Registered {formatDate(patient.created_at)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-danger" onClick={() => navigate('/emergency/new', { state: { patient_id: patient.id, patient_name: patient.full_name } })}>
            <Zap size={14} /> Create Emergency Case
          </button>
          {editing ? (
            <>
              <button className="btn btn-success" onClick={handleSave} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}><X size={14} /> Cancel</button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              <Edit3 size={14} /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Patient Info */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 16 }}><User size={15} /> Patient Information</div>
            {editing ? (
              <div className="grid-2">
                <Field label="Full Name">
                  <input className="form-input" value={form.full_name || ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                </Field>
                <Field label="Age">
                  <input className="form-input" type="number" value={form.age || ''} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
                </Field>
                <Field label="Gender">
                  <select className="form-select" value={form.gender || ''} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">—</option>
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Blood Group">
                  <select className="form-select" value={form.blood_group || ''} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}>
                    <option value="">—</option>
                    {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Phone">
                  <input className="form-input" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </Field>
                <Field label="Emergency Contact">
                  <input className="form-input" value={form.emergency_contact || ''} onChange={e => setForm(f => ({ ...f, emergency_contact: e.target.value }))} />
                </Field>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Address">
                    <input className="form-input" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </Field>
                </div>
              </div>
            ) : (
              <div className="detail-grid">
                <span className="detail-label">Full Name</span><span className="detail-value">{patient.full_name}</span>
                <span className="detail-label">Age / Gender</span><span className="detail-value">{patient.age}y / {patient.gender || '—'}</span>
                <span className="detail-label">Blood Group</span>
                <span className="detail-value">
                  <span style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '2px 8px', borderRadius: 5, fontSize: 13, fontWeight: 700 }}>
                    {patient.blood_group || '—'}
                  </span>
                </span>
                <span className="detail-label">Phone</span><span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {patient.phone || '—'}</span>
                <span className="detail-label">Emergency Contact</span><span className="detail-value">{patient.emergency_contact || '—'}</span>
                <span className="detail-label">Address</span><span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {patient.address || '—'}</span>
              </div>
            )}
          </div>

          {/* Emergency Cases */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 16 }}><Zap size={15} color="#ef4444" /> Emergency Cases</div>
            {patient.emergency_cases?.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p>No emergency cases on record.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {patient.emergency_cases.map((c) => (
                  <div
                    key={c.id}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}
                    onClick={() => navigate(`/emergency/${c.id}`)}
                  >
                    <div className="flex-between">
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#60a5fa' }}>{c.case_ref}</span>
                      <span className={caseStatusBadge(c.status)}>{caseStatusLabel(c.status)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {formatDate(c.created_at)} · {c.priority}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Appointments */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <div className="section-title"><Calendar size={15} /> Appointments</div>
          </div>
          {patient.appointments?.length === 0 ? (
            <div className="empty-state"><p>No appointments on record.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date / Time</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {patient.appointments.map((a) => (
                  <tr key={a.id}>
                    <td><div>{formatDate(a.date)}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.time}</div></td>
                    <td>{a.doctor || '—'}</td>
                    <td>{a.department || '—'}</td>
                    <td>{a.reason || '—'}</td>
                    <td><span className={apptStatusBadge(a.status)}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
