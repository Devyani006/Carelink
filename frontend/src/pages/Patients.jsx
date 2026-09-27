import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatients, createPatient } from '../api';
import { Users, Search, Plus, X, Phone, Droplets, AlertTriangle, ArrowRight, UserPlus, MapPin, Zap } from 'lucide-react';
import { useToast } from '../ToastContext';
import { formatDate } from '../utils';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const load = async (q) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatients(q);
      setPatients(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => load(e.target.value), 300);
  };

  const handleAdded = (p) => {
    setPatients((prev) => [p, ...prev]);
    setShowAdd(false);
    toast('Patient profile created successfully', 'success');
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="page-title">
              <Users size={22} color="var(--color-slate)" strokeWidth={2.4} />
              Patient Directory
            </div>
            <div className="page-subtitle">{patients.length} registered patient profiles in the CareLink hospital network</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} strokeWidth={2.5} /> Register New Patient
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Search Bar */}
        <div className="search-wrap" style={{ marginBottom: 22 }}>
          <Search size={16} />
          <input
            className="form-input search-input"
            placeholder="Search by patient name, phone number, blood group or address..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 18 }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <Users size={40} color="var(--color-slate)" />
            <h3>No patient records located</h3>
            <p>Try querying a different name or register a new patient profile.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {patients.map((p) => (
              <PatientCard
                key={p.id}
                patient={p}
                onClick={() => navigate(`/patients/${p.id}`)}
                onEmergency={(e) => {
                  e.stopPropagation();
                  navigate('/emergency/new', { state: { patient_id: p.id, patient_name: p.full_name } });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddPatientModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />}
    </div>
  );
}

function PatientCard({ patient: p, onClick, onEmergency }) {
  return (
    <div
      className="card"
      style={{
        cursor: 'pointer',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
      onClick={onClick}
    >
      <div>
        <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 15, color: 'var(--color-slate-text)',
            }}>
              {p.full_name[0]}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {p.full_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500 }}>
                {p.gender ? `${p.gender}` : ''}{p.age ? `, ${p.age} yrs` : ''} · ID: #{p.id}
              </div>
            </div>
          </div>

          <span className="badge badge-red font-extrabold">
            {p.blood_group || '—'}
          </span>
        </div>

        {p.address && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, fontWeight: 500 }}>
            <MapPin size={12} color="var(--text-muted)" />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.address}</span>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1.5px solid var(--border-light)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
          <Phone size={12} color="var(--text-muted)" /> {p.phone || 'No contact'}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-sm btn-danger"
            style={{ padding: '3px 8px', fontSize: 11 }}
            title="Create Emergency Case"
            onClick={onEmergency}
          >
            <Zap size={11} /> Emergency
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-slate-text)', display: 'flex', alignItems: 'center', gap: 2 }}>
            View <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}

function AddPatientModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    full_name: '', age: '', gender: '', blood_group: '',
    phone: '', emergency_contact: '', address: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { setErr('Full name is required'); return; }
    setSaving(true);
    setErr('');
    try {
      const p = await createPatient({ ...form, age: form.age ? parseInt(form.age) : null });
      onAdded(p);
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
            <UserPlus size={18} color="var(--brand-red)" strokeWidth={2.4} /> Register New Patient
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
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                placeholder="e.g. Anand Sharma"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                className="form-input"
                type="number"
                value={form.age}
                onChange={e => set('age', e.target.value)}
                placeholder="e.g. 42"
                min={0}
                max={120}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select gender</option>
                {GENDERS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select className="form-select" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Contact</label>
              <input
                className="form-input"
                value={form.emergency_contact}
                onChange={e => set('emergency_contact', e.target.value)}
                placeholder="Contact name & relationship"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Residential Address</label>
            <input
              className="form-input"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="House, Street, Area, City"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating Record…' : 'Save Patient Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
