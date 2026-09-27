import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatients, createPatient } from '../api';
import { Users, Search, Plus, X, Phone, Droplets, AlertTriangle } from 'lucide-react';
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
    toast('Patient added successfully', 'success');
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <div className="page-title">Patients</div>
            <div className="page-subtitle">{patients.length} registered patients</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Patient
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Search */}
        <div className="search-wrap mb-4" style={{ marginBottom: 20 }}>
          <Search size={15} />
          <input
            className="form-input search-input"
            placeholder="Search by name, phone, blood group…"
            value={search}
            onChange={handleSearch}
          />
        </div>

        {error && (
          <div className="alert alert-danger mb-4">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <h3>No patients found</h3>
            <p>Try a different search or add a new patient.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {patients.map((p) => (
              <PatientCard key={p.id} patient={p} onClick={() => navigate(`/patients/${p.id}`)} />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddPatientModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />}
    </div>
  );
}

function PatientCard({ patient: p, onClick }) {
  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div className="flex-between mb-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(59,130,246,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 15, color: '#60a5fa',
          }}>
            {p.full_name[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{p.full_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {p.gender}, {p.age}y
            </div>
          </div>
        </div>
        <span style={{
          background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
          fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
          border: '1px solid rgba(239,68,68,0.2)',
        }}>
          {p.blood_group || '—'}
        </span>
      </div>
      <div className="divider" style={{ margin: '10px 0' }} />
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Phone size={11} /> {p.phone || 'No phone'}
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
          <span className="modal-title">Add New Patient</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body">
          {err && <div className="alert alert-danger mb-3" style={{ marginBottom: 12 }}><AlertTriangle size={14} /> {err}</div>}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="e.g. Arjun Mehta" />
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input className="form-input" type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="e.g. 34" min={0} max={120} />
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
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91-9876543210" />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Contact</label>
              <input className="form-input" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} placeholder="Name: +91-..." />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, City" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Add Patient'}
          </button>
        </div>
      </div>
    </div>
  );
}
