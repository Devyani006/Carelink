import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPatients, createEmergencyCase } from '../api';
import { Zap, ArrowLeft, Search, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../ToastContext';

const PRIORITIES = ['EMERGENCY', 'URGENT', 'ROUTINE'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Whole Blood', 'Packed RBC', 'Platelets', 'Fresh Frozen Plasma', 'Cryoprecipitate'];

export default function CreateEmergencyCase() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const prefill = location.state || {};

  const [step, setStep] = useState(1);
  const [patients, setPatients] = useState([]);
  const [pSearch, setPSearch] = useState(prefill.patient_name || '');
  const [selectedPatient, setSelectedPatient] = useState(
    prefill.patient_id ? { id: prefill.patient_id, full_name: prefill.patient_name } : null
  );
  const [form, setForm] = useState({
    priority: 'URGENT',
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
    if (!selectedPatient) { setErr('Please select a patient'); return; }
    if (!form.pickup_location.trim()) { setErr('Pickup location is required'); return; }
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
      toast(`Emergency case ${c.case_ref} created`, 'success');
      navigate(`/emergency/${c.id}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const priorityColors = {
    EMERGENCY: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.4)', text: '#fca5a5' },
    URGENT: { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.4)', text: '#fdba74' },
    ROUTINE: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd' },
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={14} /></button>
          <div>
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={20} color="#ef4444" /> Create Emergency Coordination Case
            </div>
            <div className="page-subtitle">Coordinate a patient emergency — ambulance, blood and facility.</div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="alert alert-info mb-4" style={{ marginBottom: 20 }}>
          <Info size={14} />
          This creates a coordination case only. It does not replace calling emergency services (112). Ambulance and blood data shown is demo coordination information.
        </div>

        <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {err && <div className="alert alert-danger"><AlertTriangle size={14} /> {err}</div>}

          {/* Patient */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 14 }}>1. Select Patient</div>
            {selectedPatient ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#60a5fa' }}>
                  {selectedPatient.full_name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPatient.full_name}</div>
                  {selectedPatient.blood_group && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Blood: {selectedPatient.blood_group}</div>}
                </div>
                <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setSelectedPatient(null); setPSearch(''); }}>
                  Change
                </button>
              </div>
            ) : (
              <div>
                <div className="search-wrap mb-2" style={{ marginBottom: 8 }}>
                  <Search size={15} />
                  <input
                    className="form-input search-input"
                    placeholder="Search patient by name, phone…"
                    value={pSearch}
                    onChange={e => { setPSearch(e.target.value); searchPatients(e.target.value); }}
                  />
                </div>
                {patients.length > 0 && (
                  <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, overflow: 'hidden' }}>
                    {patients.slice(0, 5).map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedPatient(p); setPatients([]); }}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 10, alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{p.blood_group} · {p.age}y</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 14 }}>2. Coordination Priority</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {PRIORITIES.map(p => {
                const colors = priorityColors[p];
                const isSelected = form.priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => set('priority', p)}
                    style={{
                      flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${isSelected ? colors.border : 'var(--border-light)'}`,
                      background: isSelected ? colors.bg : 'var(--bg-primary)', color: isSelected ? colors.text : 'var(--text-muted)',
                      fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 14 }}>3. Location Details</div>
            <div className="form-group">
              <label className="form-label">Pickup Location *</label>
              <input className="form-input" value={form.pickup_location} onChange={e => set('pickup_location', e.target.value)} placeholder="e.g. MG Road, Bengaluru" />
            </div>
            <div className="form-group">
              <label className="form-label">Destination Facility (optional)</label>
              <input className="form-input" value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. Apollo Hospitals" />
            </div>
          </div>

          {/* Blood */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 14 }}>4. Blood Requirement</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <button
                onClick={() => set('blood_required', false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', border: `2px solid ${!form.blood_required ? 'rgba(59,130,246,0.4)' : 'var(--border-light)'}`, background: !form.blood_required ? 'rgba(59,130,246,0.08)' : 'var(--bg-primary)', color: !form.blood_required ? '#93c5fd' : 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}
              >
                No Blood Required
              </button>
              <button
                onClick={() => set('blood_required', true)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', border: `2px solid ${form.blood_required ? 'rgba(239,68,68,0.4)' : 'var(--border-light)'}`, background: form.blood_required ? 'rgba(239,68,68,0.08)' : 'var(--bg-primary)', color: form.blood_required ? '#fca5a5' : 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}
              >
                Blood Required
              </button>
            </div>
            {form.blood_required && (
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Component</label>
                  <select className="form-select" value={form.blood_component} onChange={e => set('blood_component', e.target.value)}>
                    {COMPONENTS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Units Required</label>
                  <input className="form-input" type="number" min={1} max={20} value={form.blood_units} onChange={e => set('blood_units', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 14 }}>5. Administrative Notes</div>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Additional coordination notes (not medical advice)…"
              rows={3}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn btn-danger btn-lg" onClick={handleSubmit} disabled={saving} style={{ flex: 1 }}>
              <Zap size={16} />
              {saving ? 'Creating Case…' : 'Create Emergency Coordination Case'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
