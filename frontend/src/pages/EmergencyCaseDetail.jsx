import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getEmergencyCase, updateCaseStatus,
  getAvailableAmbulances, requestAmbulance, updateAmbulanceStatus,
  searchBloodSources, createBloodRequest, updateBloodStatus,
  getFacilities, contactFacility, updateFacilityStatus,
} from '../api';
import {
  ArrowLeft, Clock, Ambulance, Droplets, Building2,
  CheckCircle, ChevronRight, AlertTriangle, RefreshCw,
  MapPin, Phone, User, Info, Shield, Zap, X
} from 'lucide-react';
import { useToast } from '../ToastContext';
import {
  priorityBadge, caseStatusBadge, ambStatusBadge, bloodStatusBadge,
  formatDuration, formatTime, caseStatusLabel, nextCaseStatuses,
  bloodFreshnessClass
} from '../utils';

export default function EmergencyCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [showAmbModal, setShowAmbModal] = useState(false);
  const [showBloodModal, setShowBloodModal] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getEmergencyCase(id);
      setCaseData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, refreshKey]);

  const handleStatusUpdate = async (newStatus, notes) => {
    try {
      await updateCaseStatus(id, { status: newStatus, notes });
      toast(`Case status → ${caseStatusLabel(newStatus)}`, 'success');
      setRefreshKey(k => k + 1);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (loading) return <div className="page-body" style={{ paddingTop: 24 }}><div className="skeleton" style={{ height: 400 }} /></div>;
  if (error) return (
    <div className="page-header">
      <div className="alert alert-danger"><AlertTriangle size={14} /> {error}
        <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={load}>Retry</button>
      </div>
    </div>
  );
  if (!caseData) return null;

  const c = caseData;
  const isActive = !['CLOSED', 'RECEIVED'].includes(c.status);
  const nextStatuses = nextCaseStatuses(c.status);

  return (
    <div>
      {/* Header */}
      <div className="command-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/emergency')}><ArrowLeft size={14} /></button>
          <div className="command-title" style={{ margin: 0 }}>Emergency Case</div>
        </div>

        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{c.case_ref}</h1>
              <span className={priorityBadge(c.priority)}>{c.priority}</span>
              <span className={caseStatusBadge(c.status)}>{caseStatusLabel(c.status)}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} />{c.full_name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{formatDuration(c.created_at)} elapsed</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setRefreshKey(k => k + 1)}>
              <RefreshCw size={13} /> Refresh
            </button>
            {nextStatuses.map(s => (
              <button key={s} className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(s)}>
                → {caseStatusLabel(s)}
              </button>
            ))}
            {isActive && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate('CLOSED')}>
                Close Case
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingLeft: 32, display: 'flex', gap: 0 }}>
        {['overview', 'timeline', 'ambulance', 'blood', 'facility'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 20px', fontSize: 13, fontWeight: 600,
            color: activeTab === tab ? '#60a5fa' : 'var(--text-muted)',
            borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
            textTransform: 'capitalize', transition: 'color 0.15s',
          }}>
            {tab === 'overview' ? 'Overview' :
             tab === 'timeline' ? `Timeline (${c.timeline?.length || 0})` :
             tab === 'ambulance' ? 'Ambulance' :
             tab === 'blood' ? 'Blood' : 'Facility'}
          </button>
        ))}
      </div>

      <div className="page-body" style={{ paddingTop: 20 }}>
        {activeTab === 'overview' && <OverviewTab c={c} />}
        {activeTab === 'timeline' && <TimelineTab timeline={c.timeline || []} />}
        {activeTab === 'ambulance' && (
          <AmbulanceTab c={c} onRefresh={() => setRefreshKey(k => k + 1)} toast={toast} />
        )}
        {activeTab === 'blood' && (
          <BloodTab c={c} onRefresh={() => setRefreshKey(k => k + 1)} toast={toast} />
        )}
        {activeTab === 'facility' && (
          <FacilityTab c={c} onRefresh={() => setRefreshKey(k => k + 1)} toast={toast} />
        )}
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ c }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Patient */}
      <div className="card">
        <div className="section-title mb-3" style={{ marginBottom: 14 }}><User size={15} /> Patient</div>
        <div className="detail-grid">
          <span className="detail-label">Name</span><span className="detail-value" style={{ fontWeight: 600 }}>{c.full_name}</span>
          <span className="detail-label">Age / Gender</span><span className="detail-value">{c.age}y / {c.gender || '—'}</span>
          <span className="detail-label">Blood Group</span>
          <span className="detail-value">
            <span style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '2px 8px', borderRadius: 5, fontWeight: 700 }}>{c.blood_group || '—'}</span>
          </span>
          <span className="detail-label">Phone</span><span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} />{c.phone || '—'}</span>
        </div>
      </div>

      {/* Case Details */}
      <div className="card">
        <div className="section-title mb-3" style={{ marginBottom: 14 }}><Zap size={15} color="#ef4444" /> Case Details</div>
        <div className="detail-grid">
          <span className="detail-label">Case ID</span><span className="detail-value" style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{c.case_ref}</span>
          <span className="detail-label">Priority</span>
          <span className="detail-value"><span className={priorityBadge(c.priority)}>{c.priority}</span></span>
          <span className="detail-label">Status</span>
          <span className="detail-value"><span className={caseStatusBadge(c.status)}>{caseStatusLabel(c.status)}</span></span>
          <span className="detail-label">Duration</span>
          <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{formatDuration(c.created_at)}</span>
          <span className="detail-label">Pickup</span>
          <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{c.pickup_location || '—'}</span>
          <span className="detail-label">Destination</span><span className="detail-value">{c.destination || '—'}</span>
        </div>
      </div>

      {/* Coordination Status */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="section-title mb-3" style={{ marginBottom: 14 }}>Coordination Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <CoordCard icon={<Ambulance size={18} />} title="Ambulance" color="#f97316"
            status={c.amb_status} badge={c.amb_status ? ambStatusBadge(c.amb_status) : null}
            detail={c.amb_provider} sub={c.vehicle_number}
            empty="Not yet requested"
          />
          <CoordCard icon={<Droplets size={18} />} title="Blood" color="#8b5cf6"
            status={c.blood_status}
            badge={c.blood_status ? bloodStatusBadge(c.blood_status) : c.blood_required ? 'badge badge-amber' : null}
            detail={c.blood_required ? `${c.blood_units || 0}u ${c.blood_grp || ''} ${c.blood_component || ''}` : null}
            sub={c.blood_source_name}
            empty={c.blood_required ? 'Blood search not started' : 'Not required'}
            showBadgeText={c.blood_required && !c.blood_status ? 'REQUIRED' : c.blood_status}
          />
          <CoordCard icon={<Building2 size={18} />} title="Facility" color="#06b6d4"
            status={null}
            badge={c.destination ? 'badge badge-teal' : null}
            detail={c.destination || null}
            empty="No facility selected"
            showBadgeText={c.destination ? 'SELECTED' : null}
          />
        </div>
      </div>

      {c.notes && (
        <div className="card">
          <div className="section-title mb-2" style={{ marginBottom: 8 }}><Info size={15} /> Administrative Notes</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.notes}</p>
        </div>
      )}

      <div className="alert alert-warning" style={{ gridColumn: '1/-1' }}>
        <Shield size={14} />
        <span>Ambulance, blood and facility data shown is <strong>demo coordination information only</strong>. This platform does not replace emergency services. For real emergencies, call 112.</span>
      </div>
    </div>
  );
}

function CoordCard({ icon, title, color, badge, detail, sub, empty, showBadgeText }) {
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {badge && showBadgeText ? (
        <span className={badge}>{showBadgeText}</span>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{empty}</span>
      )}
      {detail && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{detail}</div>}
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Timeline Tab ──────────────────────────────────────────────────────────────

function TimelineTab({ timeline }) {
  if (!timeline.length) return (
    <div className="empty-state"><Clock size={32} /><h3>No events yet</h3><p>Timeline will appear as case progresses.</p></div>
  );
  return (
    <div className="card">
      <div className="timeline">
        {[...timeline].reverse().map((ev, i) => (
          <div key={ev.id} className="timeline-item">
            <div className={`timeline-dot${i === 0 ? ' active' : ''}`} />
            <div className="timeline-time">{formatTime(ev.created_at)}</div>
            <div className="timeline-event" style={{ color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: i === 0 ? 500 : 400 }}>
              {ev.description}
            </div>
            <div className="timeline-actor">{ev.actor} · {ev.event_type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ambulance Tab ─────────────────────────────────────────────────────────────

function AmbulanceTab({ c, onRefresh, toast }) {
  const [available, setAvailable] = useState([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadAvailable = async () => {
    setLoadingAvail(true);
    try { setAvailable(await getAvailableAmbulances()); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoadingAvail(false); }
  };

  useEffect(() => { if (!c.amb_status) loadAvailable(); }, [c.amb_status]);

  const handleRequest = async () => {
    if (!selected) { toast('Select an ambulance first', 'error'); return; }
    setRequesting(true);
    try {
      await requestAmbulance({
        case_id: c.id,
        provider: selected.provider,
        ambulance_type: selected.type,
        vehicle_number: selected.vehicle,
        driver_name: 'Assigned Driver',
        driver_phone: selected.contact,
        location: selected.location,
        distance_km: selected.distance_km,
      });
      toast('Ambulance request created', 'success');
      onRefresh();
    } catch (e) { toast(e.message, 'error'); }
    finally { setRequesting(false); }
  };

  const handleStatusUpdate = async (status) => {
    if (!c.amb_request_id) return;
    setUpdating(true);
    try {
      await updateAmbulanceStatus(c.amb_request_id, { status });
      toast(`Ambulance status → ${status}`, 'success');
      onRefresh();
    } catch (e) { toast(e.message, 'error'); }
    finally { setUpdating(false); }
  };

  const AMB_NEXT = {
    REQUESTED: 'ASSIGNED',
    ASSIGNED: 'EN_ROUTE',
    EN_ROUTE: 'ARRIVED',
    ARRIVED: 'TRANSFERRED',
  };

  if (c.amb_status) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="section-title mb-3" style={{ marginBottom: 14 }}><Ambulance size={15} /> Ambulance Assignment</div>
          <div className="detail-grid">
            <span className="detail-label">Status</span>
            <span className="detail-value"><span className={ambStatusBadge(c.amb_status)}>{c.amb_status}</span></span>
            <span className="detail-label">Provider</span><span className="detail-value">{c.amb_provider || '—'}</span>
            <span className="detail-label">Vehicle</span><span className="detail-value" style={{ fontFamily: 'monospace' }}>{c.vehicle_number || '—'}</span>
            <span className="detail-label">Driver</span><span className="detail-value">{c.driver_name || '—'}</span>
            <span className="detail-label">Contact</span><span className="detail-value">{c.driver_phone || '—'}</span>
            <span className="detail-label">Type</span><span className="detail-value">{c.ambulance_type || '—'}</span>
          </div>
        </div>

        <div className="card">
          <div className="section-title mb-3" style={{ marginBottom: 14 }}>Update Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(AMB_NEXT).map(([from, to]) => (
              c.amb_status === from && (
                <button key={to} className="btn btn-primary" onClick={() => handleStatusUpdate(to)} disabled={updating}>
                  <ChevronRight size={14} /> Mark as {to}
                </button>
              )
            ))}
            {!AMB_NEXT[c.amb_status] && (
              <div className="alert alert-success">
                <CheckCircle size={14} /> Ambulance coordination complete.
              </div>
            )}
          </div>
        </div>

        <div className="alert alert-warning" style={{ gridColumn: '1/-1' }}>
          <Shield size={14} /> Demo coordination data. Not a real ambulance dispatch system.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="alert alert-info mb-4" style={{ marginBottom: 16 }}>
        <Info size={14} /> Select an available coordination unit below. This is demo data — not a real dispatch system.
      </div>

      {loadingAvail ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {available.map(a => (
            <div
              key={a.id}
              onClick={() => a.available && setSelected(a)}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${selected?.id === a.id ? '#3b82f6' : 'var(--border-light)'}`,
                borderRadius: 10, padding: '14px 16px', cursor: a.available ? 'pointer' : 'not-allowed',
                opacity: a.available ? 1 : 0.5,
                transition: 'all 0.15s',
              }}
            >
              <div className="flex-between mb-2">
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{a.provider}</div>
                {a.available
                  ? <span className="badge badge-green">AVAILABLE</span>
                  : <span className="badge badge-gray">BUSY</span>
                }
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.type}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
                <span><MapPin size={11} style={{ display: 'inline' }} /> {a.distance_km}km</span>
                <span><Clock size={11} style={{ display: 'inline' }} /> ETA ~{a.eta_min}min</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary btn-lg" onClick={handleRequest} disabled={!selected || requesting}>
        <Ambulance size={16} />
        {requesting ? 'Requesting…' : selected ? `Request ${selected.provider}` : 'Select an Ambulance'}
      </button>
    </div>
  );
}

// ── Blood Tab ─────────────────────────────────────────────────────────────────

function BloodTab({ c, onRefresh, toast }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [maxKm, setMaxKm] = useState(10);
  const [filter, setFilter] = useState({ blood_group: c.blood_group || '', component: c.blood_component || '' });

  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const COMPONENTS = ['Whole Blood', 'Packed RBC', 'Platelets', 'Fresh Frozen Plasma'];

  const loadSources = async () => {
    setLoading(true);
    try {
      const data = await searchBloodSources({
        blood_group: filter.blood_group || undefined,
        component: filter.component || undefined,
        max_km: maxKm,
      });
      setSources(data);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (!c.blood_request_id) loadSources(); }, [maxKm, filter]);

  const handleCreateRequest = async () => {
    if (!selected) { toast('Select a blood source', 'error'); return; }
    setCreating(true);
    try {
      await createBloodRequest({
        case_id: c.id,
        blood_group: selected.blood_group,
        component: selected.component,
        units_required: c.blood_units || 1,
      });
      await updateBloodStatus(0, { status: 'MATCH_FOUND', source_id: selected.id }).catch(() => {});
      // Re-fetch to get new ID
      onRefresh();
      toast('Blood coordination request created', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setCreating(false); }
  };

  const handleStatusUpdate = async (status) => {
    if (!c.blood_request_id) return;
    setUpdating(true);
    try {
      await updateBloodStatus(c.blood_request_id, { status, source_id: c.blood_source_name ? undefined : selected?.id });
      toast(`Blood status → ${status}`, 'success');
      onRefresh();
    } catch (e) { toast(e.message, 'error'); }
    finally { setUpdating(false); }
  };

  const BLOOD_NEXT = {
    REQUESTED: 'SEARCHING',
    SEARCHING: 'MATCH_FOUND',
    MATCH_FOUND: 'CONTACTED',
    CONTACTED: 'CONFIRMED',
    CONFIRMED: 'FULFILLED',
  };

  if (c.blood_request_id) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="section-title mb-3" style={{ marginBottom: 14 }}><Droplets size={15} /> Blood Request</div>
          <div className="detail-grid">
            <span className="detail-label">Status</span>
            <span className="detail-value"><span className={bloodStatusBadge(c.blood_status)}>{c.blood_status}</span></span>
            <span className="detail-label">Blood Group</span>
            <span className="detail-value"><span style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '2px 8px', borderRadius: 5, fontWeight: 700 }}>{c.blood_grp || '—'}</span></span>
            <span className="detail-label">Component</span><span className="detail-value">{c.blood_component || '—'}</span>
            <span className="detail-label">Units Required</span><span className="detail-value">{c.units_required || '—'}</span>
            <span className="detail-label">Source</span><span className="detail-value">{c.blood_source_name || '—'}</span>
            <span className="detail-label">Location</span><span className="detail-value">{c.blood_source_loc || '—'}</span>
          </div>
        </div>

        <div className="card">
          <div className="section-title mb-3" style={{ marginBottom: 14 }}>Update Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BLOOD_NEXT[c.blood_status] && (
              <button className="btn btn-primary" onClick={() => handleStatusUpdate(BLOOD_NEXT[c.blood_status])} disabled={updating}>
                <ChevronRight size={14} /> Mark as {BLOOD_NEXT[c.blood_status]}
              </button>
            )}
            {!BLOOD_NEXT[c.blood_status] && (
              <div className="alert alert-success"><CheckCircle size={14} /> Blood coordination complete.</div>
            )}
          </div>
        </div>

        <div className="alert alert-warning" style={{ gridColumn: '1/-1' }}>
          <Shield size={14} /> Demo coordination data. Not a real blood bank availability system.
        </div>
      </div>
    );
  }

  if (!c.blood_required) {
    return (
      <div className="empty-state">
        <Droplets size={32} />
        <h3>Blood not required</h3>
        <p>This case was created without blood coordination requirement.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="alert alert-info mb-4" style={{ marginBottom: 16 }}>
        <Info size={14} /> Blood requirement: <strong>{c.blood_units}u {c.blood_group} {c.blood_component}</strong> · Demo coordination data only.
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: 120 }} value={filter.blood_group}
          onChange={e => setFilter(f => ({ ...f, blood_group: e.target.value }))}>
          <option value="">All groups</option>
          {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
        </select>
        <select className="form-select" style={{ width: 160 }} value={filter.component}
          onChange={e => setFilter(f => ({ ...f, component: e.target.value }))}>
          <option value="">All components</option>
          {COMPONENTS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="form-select" style={{ width: 120 }} value={maxKm}
          onChange={e => setMaxKm(Number(e.target.value))}>
          <option value={5}>Within 5km</option>
          <option value={10}>Within 10km</option>
          <option value={15}>Within 15km</option>
          <option value={25}>Within 25km</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={loadSources}>Search</button>
      </div>

      {/* Expand */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[5, 10, 25].map(km => (
          <button key={km} className="btn btn-secondary btn-sm" onClick={() => setMaxKm(maxKm + km)}>
            + Expand +{km}km
          </button>
        ))}
      </div>

      {loading ? <div className="skeleton" style={{ height: 200 }} /> : (
        <>
          {sources.length === 0 ? (
            <div className="empty-state">
              <Droplets size={32} />
              <h3>No sources found</h3>
              <p>Try expanding search radius or changing filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
              {sources.map(s => (
                <BloodSourceCard
                  key={s.id} source={s}
                  selected={selected?.id === s.id}
                  onSelect={() => setSelected(s)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <button className="btn btn-primary btn-lg" onClick={handleCreateRequest} disabled={creating}>
          <Droplets size={16} />
          {creating ? 'Coordinating…' : `Coordinate with ${selected.name}`}
        </button>
      )}
    </div>
  );
}

function BloodSourceCard({ source: s, selected, onSelect }) {
  return (
    <div className={`blood-card${selected ? ' selected' : ''}`} onClick={onSelect}>
      <div className="flex-between mb-1">
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{s.name}</div>
        <span style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>{s.blood_group}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{s.type} · {s.location}</div>
      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
        <span><strong style={{ color: 'var(--text-primary)' }}>{s.units_available}u</strong> <span style={{ color: 'var(--text-muted)' }}>{s.component}</span></span>
        <span style={{ color: 'var(--text-muted)' }}><MapPin size={11} style={{ display: 'inline' }} /> {s.distance_km}km</span>
        <span className={bloodFreshnessClass(s.freshness)} style={{ fontSize: 11, fontWeight: 600 }}>● {s.freshness}</span>
      </div>
    </div>
  );
}

// ── Facility Tab ──────────────────────────────────────────────────────────────

function FacilityTab({ c, onRefresh, toast }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getFacilities().then(setFacilities).catch(e => toast(e.message, 'error')).finally(() => setLoading(false));
  }, []);

  const handleContact = async (facility) => {
    setContacting(facility.id);
    try {
      await contactFacility({ case_id: c.id, facility_id: facility.id });
      toast(`Contact initiated with ${facility.name}`, 'success');
      onRefresh();
    } catch (e) { toast(e.message, 'error'); }
    finally { setContacting(null); }
  };

  const handleFacilityStatus = async (status) => {
    setUpdating(true);
    try {
      await updateFacilityStatus({ case_id: c.id, status });
      toast(`Facility ${status}`, 'success');
      onRefresh();
    } catch (e) { toast(e.message, 'error'); }
    finally { setUpdating(false); }
  };

  return (
    <div>
      <div className="alert alert-info mb-4" style={{ marginBottom: 16 }}>
        <Info size={14} /> Demo coordination data. Contact the facility to confirm actual bed/resource availability before dispatch.
      </div>

      {c.destination && (
        <div className="card mb-4" style={{ marginBottom: 16, borderColor: 'rgba(6,182,212,0.3)' }}>
          <div className="flex-between">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Current Destination</div>
              <div style={{ fontSize: 13, color: '#67e8f9', marginTop: 2 }}>{c.destination}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-success btn-sm" onClick={() => handleFacilityStatus('ACCEPTED')} disabled={updating}>
                <CheckCircle size={13} /> Accept
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleFacilityStatus('DECLINED')} disabled={updating}>
                <X size={13} /> Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="skeleton" style={{ height: 300 }} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {facilities.map(f => (
            <div key={f.id} className="facility-card">
              <div className="flex-between mb-2">
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{f.name}</div>
                {f.emergency_available
                  ? <span className="badge badge-green">AVAILABLE</span>
                  : <span className="badge badge-gray">LIMITED</span>
                }
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                {f.type} · {f.location}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                <span><MapPin size={11} style={{ display: 'inline' }} /> {f.distance_km}km</span>
                <span><Building2 size={11} style={{ display: 'inline' }} /> {f.icu_beds} ICU beds</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={() => handleContact(f)}
                disabled={contacting === f.id}
              >
                {contacting === f.id ? 'Contacting…' : 'Contact Facility'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
