import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPatients, createEmergencyCase } from '../api';
import { Zap, ArrowLeft, Search, AlertTriangle, User, MapPin, Building2, Droplets, CheckCircle } from 'lucide-react';
import { useToast } from '../ToastContext';

const PRIORITIES = [
  { id: 'EMERGENCY', label: 'Emergency (Critical)', desc: 'Immediate emergency dispatch & high-priority resource reservation', color: 'var(--brand-red)' },
  { id: 'URGENT', label: 'Urgent', desc: 'Accelerated transport and receiving facility coordination', color: 'var(--color-urgent)' },
  { id: 'ROUTINE', label: 'Routine Transfer', desc: 'Standard non-critical medical transport between facilities', color: 'var(--color-slate)' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Whole Blood', 'Packed RBC', 'Platelets', 'Fresh Frozen Plasma', 'Cryoprecipitate'];

export default function CreateEmergencyCase() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const prefill = location.state || {};

  const [patients, setPatients] = useState([]);
  const [pSearch, setPSearch] = useState(prefill.patient_name || '');
  const [selectedPatient, setSelectedPatient] = useState(
    prefill.patient_id ? { id: prefill.patient_id, full_name: prefill.patient_name } : null
  );
  const [form, setForm] = useState({
    priority: 'EMERGENCY',
    pickup_location: '',
    destination: '',
    blood_required: false,
    blood_group: '',
    blood_component: 'Whole Blood',
    blood_units: 1,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const searchPatients = async (q) => {
    if (!q) { setPatients([]); return; }
    try {
      const data = await getPatients(q);
      setPatients(data);
    } catch (e) {}
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!selectedPatient) { setErr('Please select a patient before proceeding'); return; }
    if (!form.pickup_location.trim()) { setErr('Pickup location is required for ambulance routing'); return; }
    setSaving(true);
    setErr('');
    try {
      const c = await createEmergencyCase({
        patient_id: selectedPatient.id,
        priority: form.priority,
        pickup_location: form.pickup_location,
        destination: form.destination,
        blood_required: form.blood_required,
        blood_group: form.blood_required ? form.blood_group : null,
        blood_component: form.blood_required ? form.blood_component : null,
        blood_units: form.blood_required ? parseInt(form.blood_units) : 0,
        notes: form.notes,
      });
      toast(`Emergency coordination case ${c.case_ref} opened successfully`, 'success');
      navigate(`/emergency/${c.id}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ padding: '5px 10px' }}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="page-title">
              <Zap size={22} color="var(--brand-red)" strokeWidth={2.6} />
              Open Emergency Coordination Case
            </div>
            <div className="page-subtitle">Initiate synchronized response across ambulance fleet, blood banks and ICU beds.</div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {err && (
            <div className="alert alert-danger">
              <AlertTriangle size={16} /> {err}
            </div>
          )}

          {/* 1. Patient Selection */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 14 }}>
              <User size={18} color="var(--color-slate)" strokeWidth={2.4} /> 1. Patient Identification
            </div>
            {selectedPatient ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px'
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-slate)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, color: '#FFFFFF', fontSize: 16
                }}>
                  {selectedPatient.full_name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>
                    {selectedPatient.full_name}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Patient ID: #{selectedPatient.id} {selectedPatient.blood_group && <span className="font-bold" style={{ color: 'var(--brand-red)' }}>· Blood: {selectedPatient.blood_group}</span>}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => { setSelectedPatient(null); setPSearch(''); }}
                >
                  Change Patient
                </button>
              </div>
            ) : (
              <div>
                <div className="search-wrap" style={{ marginBottom: 8 }}>
                  <Search size={16} />
                  <input
                    className="form-input search-input"
                    placeholder="Search patient by name, phone or registration..."
                    value={pSearch}
                    onChange={e => { setPSearch(e.target.value); searchPatients(e.target.value); }}
                  />
                </div>
                {patients.length > 0 && (
                  <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-card)' }}>
                    {patients.slice(0, 5).map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          if (p.blood_group && !form.blood_group) set('blood_group', p.blood_group);
                          setPatients([]);
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-light)',
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{p.full_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 'auto', fontWeight: 600 }}>
                          {p.blood_group ? <span style={{ color: 'var(--brand-red)' }}>{p.blood_group} · </span> : ''}{p.age ? `${p.age} yrs` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Priority Classification */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 14 }}>
              <Zap size={18} color="var(--brand-red)" strokeWidth={2.4} /> 2. Priority Classification
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {PRIORITIES.map(p => {
                const isSelected = form.priority === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => set('priority', p.id)}
                    style={{
                      background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)',
                      border: isSelected ? `2px solid ${p.color}` : '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    <div style={{
                      fontWeight: 800,
                      fontSize: 13.5,
                      color: isSelected ? p.color : 'var(--text-primary)',
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>{p.label}</span>
                      {isSelected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.35, fontWeight: 500 }}>
                      {p.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Routing & Location */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 14 }}>
              <MapPin size={18} color="var(--color-slate)" strokeWidth={2.4} /> 3. Routing Details
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Pickup Location *</label>
                <input
                  className="form-input"
                  placeholder="e.g. 14 MG Road, Indiranagar, Bengaluru"
                  value={form.pickup_location}
                  onChange={e => set('pickup_location', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Hospital (Optional)</label>
                <input
                  className="form-input"
                  placeholder="e.g. Apollo Hospital, Jayanagar"
                  value={form.destination}
                  onChange={e => set('destination', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. Blood Coordination */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.blood_required ? 14 : 0 }}>
              <div className="section-title" style={{ margin: 0 }}>
                <Droplets size={18} color="var(--color-plum)" strokeWidth={2.4} /> 4. Blood Coordination
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={form.blood_required}
                  onChange={e => set('blood_required', e.target.checked)}
                  style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--brand-red)' }}
                />
                Require Emergency Blood Supply
              </label>
            </div>

            {form.blood_required && (
              <div className="grid-3" style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-select"
                    value={form.blood_group}
                    onChange={e => set('blood_group', e.target.value)}
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Component</label>
                  <select
                    className="form-select"
                    value={form.blood_component}
                    onChange={e => set('blood_component', e.target.value)}
                  >
                    {COMPONENTS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Units Needed</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    max={20}
                    value={form.blood_units}
                    onChange={e => set('blood_units', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. Incident Notes */}
          <div className="card">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Operational &amp; Incident Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Details of incident, chief medical complaint, specific equipment requirements..."
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={saving}
            >
              <Zap size={18} strokeWidth={2.4} />
              {saving ? 'Opening Case…' : 'Open Emergency Coordination Case'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
