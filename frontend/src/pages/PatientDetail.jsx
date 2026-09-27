import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatient, updatePatient } from '../api';
import {
  ArrowLeft, Edit3, Save, X, Zap, Calendar,
  Phone, User, Droplets, MapPin, AlertTriangle, ChevronRight,
  ShieldAlert, Clock
} from 'lucide-react';
import { useToast } from '../ToastContext';
import { apptStatusBadge, caseStatusBadge, formatDate, formatDuration, caseStatusLabel, priorityBadge } from '../utils';

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
      toast('Patient medical profile saved successfully', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="page-body" style={{ paddingTop: 26 }}>
      <div className="skeleton" style={{ height: 360 }} />
    </div>
  );

  if (error) return (
    <div className="page-header">
      <div className="alert alert-danger">
        <AlertTriangle size={16} /> {error}
      </div>
    </div>
  );

  if (!patient) return null;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/patients')} style={{ padding: '5px 10px' }}>
            <ArrowLeft size={14} /> Back to Directory
          </button>
          <div>
            <div className="page-title">{patient.full_name}</div>
            <div className="page-subtitle">Patient File ID: #{patient.id} · Registered in System {formatDate(patient.created_at)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/emergency/new', { state: { patient_id: patient.id, patient_name: patient.full_name } })}
          >
            <Zap size={15} strokeWidth={2.4} /> Open Emergency Coordination Case
          </button>

          {editing ? (
            <>
              <button className="btn btn-success btn-sm" onClick={handleSave} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                <X size={14} /> Cancel
              </button>
            </>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
              <Edit3 size={14} /> Edit Medical File
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18, marginBottom: 18 }}>
          {/* Patient Information Card */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 16 }}>
              <User size={18} color="var(--color-slate)" strokeWidth={2.4} /> Clinical &amp; Personal Profile
            </div>
            {editing ? (
              <div className="grid-2">
                <Field label="Full Name">
                  <input
                    className="form-input"
                    value={form.full_name || ''}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                </Field>
                <Field label="Age">
                  <input
                    className="form-input"
                    type="number"
                    value={form.age || ''}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                  />
                </Field>
                <Field label="Gender">
                  <select
                    className="form-select"
                    value={form.gender || ''}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  >
                    <option value="">—</option>
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Blood Group">
                  <select
                    className="form-select"
                    value={form.blood_group || ''}
                    onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}
                  >
                    <option value="">—</option>
                    {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Phone Contact">
                  <input
                    className="form-input"
                    value={form.phone || ''}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </Field>
                <Field label="Emergency Contact">
                  <input
                    className="form-input"
                    value={form.emergency_contact || ''}
                    onChange={e => setForm(f => ({ ...f, emergency_contact: e.target.value }))}
                  />
                </Field>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Residential Address">
                    <input
                      className="form-input"
                      value={form.address || ''}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>
            ) : (
              <div className="detail-grid">
                <span className="detail-label">Full Name</span>
                <span className="detail-value" style={{ fontWeight: 800, fontSize: 14.5 }}>{patient.full_name}</span>

                <span className="detail-label">Age &amp; Gender</span>
                <span className="detail-value">{patient.age ? `${patient.age} yrs` : '—'} / {patient.gender || '—'}</span>

                <span className="detail-label">Blood Group</span>
                <span className="detail-value">
                  <span className="badge badge-red font-extrabold" style={{ fontSize: 12, padding: '3px 8px' }}>
                    {patient.blood_group || '—'}
                  </span>
                </span>

                <span className="detail-label">Phone</span>
                <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} color="var(--text-muted)" /> {patient.phone || '—'}
                </span>

                <span className="detail-label">Emergency Contact</span>
                <span className="detail-value font-semibold">{patient.emergency_contact || '—'}</span>

                <span className="detail-label">Address</span>
                <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} color="var(--text-muted)" /> {patient.address || '—'}
                </span>
              </div>
            )}
          </div>

          {/* Emergency Coordination History */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 16 }}>
              <Zap size={18} color="var(--brand-red)" strokeWidth={2.4} /> Emergency Cases History
            </div>
            {patient.emergency_cases?.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 0' }}>
                <p>No emergency coordination records for this patient.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {patient.emergency_cases.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                    onClick={() => navigate(`/emergency/${c.id}`)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-red)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div className="flex-between">
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-slate-text)' }}>
                        {c.case_ref}
                      </span>
                      <span className={caseStatusBadge(c.status)}>{caseStatusLabel(c.status)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{formatDate(c.created_at)}</span>
                      <span className={priorityBadge(c.priority)} style={{ fontSize: 10.5 }}>{c.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clinical Appointment History */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border)' }}>
            <div className="section-title">
              <Calendar size={17} color="var(--color-slate)" strokeWidth={2.2} /> Clinical Consultation History
            </div>
          </div>
          {patient.appointments?.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 0' }}>
              <p>No appointment records on file for this patient.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Appointment Date</th>
                    <th>Physician</th>
                    <th>Department</th>
                    <th>Consultation Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.appointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(a.date)}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.time}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.doctor || '—'}</td>
                      <td><span className="badge badge-stone">{a.department || '—'}</span></td>
                      <td>{a.reason || '—'}</td>
                      <td><span className={apptStatusBadge(a.status)}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
