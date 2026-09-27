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
  MapPin, Phone, User, Info, Zap, X, Shield, Activity,
  Calendar, CheckCircle2, ShieldCheck, HeartPulse
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
      toast(`Case status advanced to ${caseStatusLabel(newStatus)}`, 'success');
      setRefreshKey(k => k + 1);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (loading) return (
    <div className="page-body" style={{ paddingTop: 26 }}>
      <div className="skeleton" style={{ height: 400 }} />
    </div>
  );

  if (error) return (
    <div className="page-header">
      <div className="alert alert-danger">
        <AlertTriangle size={16} /> {error}
        <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={load}>
          Retry
        </button>
      </div>
    </div>
  );

  if (!caseData) return null;

  const c = caseData;
  const isActive = !['CLOSED', 'RECEIVED'].includes(c.status);
  const nextStatuses = nextCaseStatuses(c.status);

  return (
    <div>
      {/* Workspace Header with Solid Identity */}
      <div className="command-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/emergency')}
            style={{ padding: '5px 10px' }}
          >
            <ArrowLeft size={14} /> Back to Command Center
          </button>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-red)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            ● Active Coordination Case
          </span>
        </div>

        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className="font-mono" style={{
                fontSize: 22, fontWeight: 800, color: 'var(--text-primary)',
                background: 'var(--bg-secondary)', padding: '2px 10px',
                borderRadius: 6, border: '1.5px solid var(--border)'
              }}>
                {c.case_ref}
              </span>
              <span className={priorityBadge(c.priority)} style={{ fontSize: 12, padding: '4px 10px' }}>{c.priority}</span>
              <span className={caseStatusBadge(c.status)} style={{ fontSize: 12, padding: '4px 10px' }}>{caseStatusLabel(c.status)}</span>
            </div>

            <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: 'var(--text-primary)' }}>
                <User size={15} color="var(--color-slate)" strokeWidth={2.4} /> {c.full_name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                <Clock size={15} color="var(--brand-red)" strokeWidth={2.2} /> {formatDuration(c.created_at)} elapsed
              </span>
              {c.pickup_location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={15} color="var(--text-muted)" strokeWidth={2.2} /> {c.pickup_location}
                </span>
              )}
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setRefreshKey(k => k + 1)}>
              <RefreshCw size={13} /> Refresh
            </button>
            {nextStatuses.map(s => (
              <button key={s} className="btn btn-primary" onClick={() => handleStatusUpdate(s)}>
                Advance Status: {caseStatusLabel(s)} →
              </button>
            ))}
            {isActive && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate('CLOSED', 'Case manually closed and archived.')}>
                Close Case
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Case Navigation Tabs */}
      <div style={{
        borderBottom: '1.5px solid var(--border)',
        paddingLeft: 36,
        paddingRight: 36,
        display: 'flex',
        gap: 6,
        background: 'var(--bg-primary)',
      }}>
        {[
          { key: 'overview', label: 'Case Workspace', icon: Activity },
          { key: 'timeline', label: `Operations Log (${c.timeline?.length || 0})`, icon: Clock },
          { key: 'ambulance', label: 'Ambulance Unit', icon: Ambulance },
          { key: 'blood', label: 'Blood Coordination', icon: Droplets },
          { key: 'facility', label: 'Hospital Reception', icon: Building2 },
        ].map(tab => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: isCurrent ? 'var(--bg-card)' : 'transparent',
                border: '1.5px solid',
                borderColor: isCurrent ? 'var(--border) var(--border) var(--bg-card) var(--border)' : 'transparent',
                borderTopLeftRadius: 'var(--radius-md)',
                borderTopRightRadius: 'var(--radius-md)',
                cursor: 'pointer',
                padding: '11px 18px',
                fontSize: 13,
                fontWeight: isCurrent ? 800 : 600,
                color: isCurrent ? 'var(--brand-red)' : 'var(--text-secondary)',
                marginBottom: -1.5,
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Icon size={15} strokeWidth={isCurrent ? 2.4 : 2} color={isCurrent ? 'var(--brand-red)' : 'var(--text-muted)'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Workspace Body */}
      <div className="page-body" style={{ paddingTop: 22 }}>
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      {/* Patient Profile Card */}
      <div className="card">
        <div className="section-title mb-3" style={{ marginBottom: 16 }}>
          <User size={18} color="var(--color-slate)" strokeWidth={2.4} />
          Patient Medical Identity
        </div>
        <div className="detail-grid">
          <span className="detail-label">Full Name</span>
          <span className="detail-value" style={{ fontWeight: 800, fontSize: 14.5 }}>{c.full_name}</span>

          <span className="detail-label">Age &amp; Gender</span>
          <span className="detail-value">{c.age ? `${c.age} years old` : '—'} · {c.gender || '—'}</span>

          <span className="detail-label">Blood Group</span>
          <span className="detail-value">
            <span className="badge badge-red font-extrabold" style={{ fontSize: 12, padding: '3px 9px' }}>
              {c.blood_group || 'Unrecorded'}
            </span>
          </span>

          <span className="detail-label">Primary Contact</span>
          <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Phone size={13} color="var(--text-muted)" /> {c.phone || '—'}
          </span>
        </div>
      </div>

      {/* Case Details Card */}
      <div className="card">
        <div className="section-title mb-3" style={{ marginBottom: 16 }}>
          <Zap size={18} color="var(--brand-red)" strokeWidth={2.4} />
          Emergency Case Details
        </div>
        <div className="detail-grid">
          <span className="detail-label">Case Number</span>
          <span className="detail-value font-mono font-bold" style={{ color: 'var(--color-slate-text)' }}>
            {c.case_ref}
          </span>

          <span className="detail-label">Priority Status</span>
          <span className="detail-value"><span className={priorityBadge(c.priority)}>{c.priority}</span></span>

          <span className="detail-label">Operational State</span>
          <span className="detail-value"><span className={caseStatusBadge(c.status)}>{caseStatusLabel(c.status)}</span></span>

          <span className="detail-label">Pickup Location</span>
          <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color="var(--text-muted)" /> {c.pickup_location || '—'}
          </span>

          <span className="detail-label">Destination Hospital</span>
          <span className="detail-value font-semibold">{c.destination || 'Unassigned'}</span>
        </div>
      </div>

      {/* Multi-Agency Coordination Status Cards */}
      <div className="card" style={{ gridColumn: '1 / -1', borderTop: '3px solid var(--brand-red)' }}>
        <div className="section-title mb-3" style={{ marginBottom: 16 }}>
          <Activity size={18} color="var(--brand-red)" strokeWidth={2.4} />
          Multi-Agency Operational Deployment
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <CoordStatusCard
            icon={<Ambulance size={22} strokeWidth={2.2} />}
            title="Ambulance Transport"
            color="var(--color-urgent)"
            status={c.amb_status}
            badge={c.amb_status ? ambStatusBadge(c.amb_status) : null}
            detail={c.amb_provider ? `${c.amb_provider} · ${c.vehicle_number || ''}` : null}
            sub={c.driver_name ? `Driver: ${c.driver_name} (${c.driver_phone || ''})` : null}
            empty="No transport unit assigned"
            showBadgeText={c.amb_status}
          />
          <CoordStatusCard
            icon={<Droplets size={22} strokeWidth={2.2} />}
            title="Blood Supply"
            color="var(--color-plum)"
            status={c.blood_status}
            badge={c.blood_status ? bloodStatusBadge(c.blood_status) : c.blood_required ? 'badge badge-amber' : null}
            detail={c.blood_required ? `${c.blood_units || 0} Units ${c.blood_grp || c.blood_group || ''} (${c.blood_component || 'Whole Blood'})` : null}
            sub={c.blood_source_name ? `Matched: ${c.blood_source_name}` : null}
            empty={c.blood_required ? 'Search pending' : 'Not required for this case'}
            showBadgeText={c.blood_required && !c.blood_status ? 'REQUIRED' : c.blood_status}
          />
          <CoordStatusCard
            icon={<Building2 size={22} strokeWidth={2.2} />}
            title="Hospital Reception"
            color="var(--color-slate)"
            status={c.destination ? 'ASSIGNED' : null}
            badge={c.destination ? 'badge badge-blue' : null}
            detail={c.destination || null}
            sub={c.destination ? 'Partner hospital notified' : null}
            empty="No receiving facility assigned"
            showBadgeText={c.destination ? 'ASSIGNED' : null}
          />
        </div>
      </div>

      {c.notes && (
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="section-title mb-2" style={{ marginBottom: 10 }}>
            <Info size={16} color="var(--text-secondary)" strokeWidth={2.2} /> Incident &amp; Operational Notes
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.notes}</p>
        </div>
      )}
    </div>
  );
}

function CoordStatusCard({ icon, title, color, badge, detail, sub, empty, showBadgeText }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 18px',
      boxShadow: 'var(--shadow-xs)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color }}>{icon}</div>
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{title}</span>
        </div>
        {badge && showBadgeText && (
          <span className={badge} style={{ fontSize: 11 }}>{showBadgeText}</span>
        )}
      </div>

      {detail ? (
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{detail}</div>
      ) : (
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 500 }}>{empty}</span>
      )}
      {sub && <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

// ── Timeline Tab ──────────────────────────────────────────────────────────────

function TimelineTab({ timeline }) {
  if (!timeline.length) return (
    <div className="empty-state">
      <Clock size={36} />
      <h3>No operational events logged yet</h3>
      <p>Events and status changes will record automatically to this log.</p>
    </div>
  );

  return (
    <div className="card">
      <div className="section-title mb-4" style={{ marginBottom: 20 }}>
        <Clock size={18} color="var(--brand-red)" strokeWidth={2.4} /> Operational Case Timeline Log
      </div>
      <div className="timeline">
        {[...timeline].reverse().map((ev, i) => (
          <div key={ev.id} className="timeline-item">
            <div className={`timeline-dot${i === 0 ? ' active' : ''}`} />
            <div className="timeline-time">{formatTime(ev.created_at)}</div>
            <div className="timeline-event" style={{
              color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: i === 0 ? 700 : 500,
              fontSize: 13.5
            }}>
              {ev.description}
            </div>
            <div className="timeline-actor">
              <span className="badge badge-brand text-xs" style={{ padding: '1px 6px' }}>{ev.actor}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{ev.event_type}</span>
            </div>
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
    try {
      setAvailable(await getAvailableAmbulances());
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoadingAvail(false);
    }
  };

  useEffect(() => {
    if (!c.amb_status) loadAvailable();
  }, [c.amb_status]);

  const handleRequest = async () => {
    if (!selected) { toast('Please select an ambulance unit first', 'error'); return; }
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
      toast(`Ambulance dispatch requested with ${selected.provider}`, 'success');
      onRefresh();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setRequesting(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!c.amb_request_id) return;
    setUpdating(true);
    try {
      await updateAmbulanceStatus(c.amb_request_id, { status });
      toast(`Ambulance status updated to ${status}`, 'success');
      onRefresh();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const AMB_NEXT = {
    REQUESTED: 'ASSIGNED',
    ASSIGNED: 'EN_ROUTE',
    EN_ROUTE: 'ARRIVED',
    ARRIVED: 'TRANSFERRED',
  };

  if (c.amb_status) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
        <div className="card">
          <div className="section-title mb-3" style={{ marginBottom: 16 }}>
            <Ambulance size={18} color="var(--color-urgent)" strokeWidth={2.4} /> Assigned Dispatch Unit
          </div>
          <div className="detail-grid">
            <span className="detail-label">Status</span>
            <span className="detail-value"><span className={ambStatusBadge(c.amb_status)}>{c.amb_status}</span></span>

            <span className="detail-label">Fleet Provider</span>
            <span className="detail-value" style={{ fontWeight: 800 }}>{c.amb_provider || '—'}</span>

            <span className="detail-label">Vehicle Reg. No.</span>
            <span className="detail-value font-mono font-bold">{c.vehicle_number || '—'}</span>

            <span className="detail-label">Assigned Driver</span>
            <span className="detail-value font-semibold">{c.driver_name || '—'}</span>

            <span className="detail-label">Driver Hotline</span>
            <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} color="var(--text-muted)" /> {c.driver_phone || '—'}
            </span>

            <span className="detail-label">Unit Specification</span>
            <span className="detail-value">{c.ambulance_type || '—'}</span>
          </div>
        </div>

        <div className="card">
          <div className="section-title mb-3" style={{ marginBottom: 16 }}>
            Advance Ambulance Dispatch
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(AMB_NEXT).map(([from, to]) => (
              c.amb_status === from && (
                <button
                  key={to}
                  className="btn btn-primary btn-lg"
                  onClick={() => handleStatusUpdate(to)}
                  disabled={updating}
                  style={{ justifyContent: 'space-between', padding: '12px 18px' }}
                >
                  <span>Mark Unit Status as <strong>{to}</strong></span>
                  <ChevronRight size={18} />
                </button>
              )
            ))}
            {!AMB_NEXT[c.amb_status] && (
              <div className="alert alert-success">
                <CheckCircle size={16} /> Patient transfer complete. Transport fulfilled.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <Ambulance size={18} color="var(--color-urgent)" strokeWidth={2.4} /> Available Regional Fleet
        </div>
        <span className="badge badge-brand">{available.length} Units Ready</span>
      </div>

      {loadingAvail ? (
        <div className="skeleton" style={{ height: 180 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          {available.map(a => (
            <div
              key={a.id}
              onClick={() => a.available && setSelected(a)}
              style={{
                background: selected?.id === a.id ? 'var(--brand-red-subtle)' : 'var(--bg-card)',
                border: '1.5px solid',
                borderColor: selected?.id === a.id ? 'var(--brand-red)' : 'var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                cursor: a.available ? 'pointer' : 'not-allowed',
                opacity: a.available ? 1 : 0.55,
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex-between mb-1">
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{a.provider}</div>
                {a.available ? (
                  <span className="badge badge-green">READY</span>
                ) : (
                  <span className="badge badge-stone">BUSY</span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {a.type} · <span className="font-mono font-bold">{a.vehicle}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, display: 'flex', gap: 16 }}>
                <span><MapPin size={12} style={{ display: 'inline' }} /> {a.distance_km} km away</span>
                <span><Clock size={12} style={{ display: 'inline' }} /> ETA ~{a.eta_min} min</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary btn-lg"
        onClick={handleRequest}
        disabled={!selected || requesting}
      >
        <Ambulance size={18} strokeWidth={2.4} />
        {requesting ? 'Dispatching Transport…' : selected ? `Confirm Dispatch: ${selected.provider}` : 'Select an Ambulance Unit'}
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
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!c.blood_request_id) loadSources();
  }, [maxKm, filter]);

  const handleCreateRequest = async () => {
    if (!selected) { toast('Please select a blood source', 'error'); return; }
    setCreating(true);
    try {
      await createBloodRequest({
        case_id: c.id,
        blood_group: selected.blood_group,
        component: selected.component,
        units_required: c.blood_units || 1,
      });
      await updateBloodStatus(0, { status: 'MATCH_FOUND', source_id: selected.id }).catch(() => {});
      onRefresh();
      toast('Blood coordination order established', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!c.blood_request_id) return;
    setUpdating(true);
    try {
      await updateBloodStatus(c.blood_request_id, { status, source_id: c.blood_source_name ? undefined : selected?.id });
      toast(`Blood status updated to ${status}`, 'success');
      onRefresh();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUpdating(false);
    }
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
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
        <div className="card">
          <div className="section-title mb-3" style={{ marginBottom: 16 }}>
            <Droplets size={18} color="var(--color-plum)" strokeWidth={2.4} /> Active Blood Supply Order
          </div>
          <div className="detail-grid">
            <span className="detail-label">Status</span>
            <span className="detail-value"><span className={bloodStatusBadge(c.blood_status)}>{c.blood_status}</span></span>

            <span className="detail-label">Blood Group</span>
            <span className="detail-value">
              <span className="badge badge-red font-extrabold" style={{ fontSize: 12 }}>{c.blood_grp || c.blood_group || '—'}</span>
            </span>

            <span className="detail-label">Component</span>
            <span className="detail-value font-semibold">{c.blood_component || 'Whole Blood'}</span>

            <span className="detail-label">Units Allocated</span>
            <span className="detail-value font-extrabold" style={{ color: 'var(--brand-red)' }}>{c.units_required || c.blood_units || '—'} Units</span>

            <span className="detail-label">Matched Bank</span>
            <span className="detail-value font-bold">{c.blood_source_name || '—'}</span>

            <span className="detail-label">Bank Address</span>
            <span className="detail-value">{c.blood_source_loc || '—'}</span>
          </div>
        </div>

        <div className="card">
          <div className="section-title mb-3" style={{ marginBottom: 16 }}>
            Advance Blood Supply Pipeline
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {BLOOD_NEXT[c.blood_status] && (
              <button
                className="btn btn-primary btn-lg"
                onClick={() => handleStatusUpdate(BLOOD_NEXT[c.blood_status])}
                disabled={updating}
                style={{ justifyContent: 'space-between', padding: '12px 18px' }}
              >
                <span>Advance Order: <strong>{BLOOD_NEXT[c.blood_status]}</strong></span>
                <ChevronRight size={18} />
              </button>
            )}
            {!BLOOD_NEXT[c.blood_status] && (
              <div className="alert alert-success">
                <CheckCircle size={16} /> Blood supply fulfilled and received by clinical team.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!c.blood_required) {
    return (
      <div className="empty-state">
        <Droplets size={36} color="var(--color-plum)" />
        <h3>Blood supply was not requested for this case</h3>
        <p>Edit case parameters if emergency blood units are needed.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="form-select"
          style={{ width: 150 }}
          value={filter.blood_group}
          onChange={e => setFilter(f => ({ ...f, blood_group: e.target.value }))}
        >
          <option value="">All Groups</option>
          {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
        </select>

        <select
          className="form-select"
          style={{ width: 190 }}
          value={filter.component}
          onChange={e => setFilter(f => ({ ...f, component: e.target.value }))}
        >
          <option value="">All Components</option>
          {COMPONENTS.map(comp => <option key={comp}>{comp}</option>)}
        </select>

        <select
          className="form-select"
          style={{ width: 150 }}
          value={maxKm}
          onChange={e => setMaxKm(Number(e.target.value))}
        >
          <option value={5}>Within 5 km</option>
          <option value={10}>Within 10 km</option>
          <option value={15}>Within 15 km</option>
          <option value={25}>Within 25 km</option>
        </select>

        <button className="btn btn-secondary btn-sm" onClick={loadSources}>
          Search Banks
        </button>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {[5, 10, 20].map(km => (
            <button
              key={km}
              className="btn btn-secondary btn-sm"
              onClick={() => setMaxKm(maxKm + km)}
            >
              +{km}km
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : sources.length === 0 ? (
        <div className="empty-state">
          <Droplets size={36} />
          <h3>No matching blood units located</h3>
          <p>Try widening the search radius or querying alternate components.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 18 }}>
          {sources.map(s => (
            <div
              key={s.id}
              className={`blood-card${selected?.id === s.id ? ' selected' : ''}`}
              onClick={() => setSelected(s)}
            >
              <div className="flex-between mb-1">
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{s.name}</div>
                <span className="badge badge-red font-extrabold">{s.blood_group}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {s.type} · {s.location}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12.5, fontWeight: 600 }}>
                <span><strong style={{ color: 'var(--brand-red)' }}>{s.units_available} Units</strong> ({s.component})</span>
                <span style={{ color: 'var(--text-muted)' }}><MapPin size={12} style={{ display: 'inline' }} /> {s.distance_km} km</span>
                <span className={bloodFreshnessClass(s.freshness)}>● {s.freshness}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <button
          className="btn btn-primary btn-lg"
          onClick={handleCreateRequest}
          disabled={creating}
        >
          <Droplets size={18} strokeWidth={2.4} />
          {creating ? 'Confirming with Blood Bank…' : `Confirm Reservation: ${selected.name}`}
        </button>
      )}
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
    getFacilities()
      .then(setFacilities)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleContact = async (facility) => {
    setContacting(facility.id);
    try {
      await contactFacility({ case_id: c.id, facility_id: facility.id });
      toast(`Facility contact initiated with ${facility.name}`, 'success');
      onRefresh();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setContacting(null);
    }
  };

  const handleFacilityStatus = async (status) => {
    setUpdating(true);
    try {
      await updateFacilityStatus({ case_id: c.id, status });
      toast(`Facility acceptance updated: ${status}`, 'success');
      onRefresh();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      {c.destination && (
        <div className="card mb-4" style={{ marginBottom: 18, borderLeft: '5px solid var(--color-slate)' }}>
          <div className="flex-between">
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Assigned Destination Facility
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                {c.destination}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-success btn-sm" onClick={() => handleFacilityStatus('ACCEPTED')} disabled={updating}>
                <CheckCircle size={14} /> Confirm Bed Acceptance
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleFacilityStatus('DECLINED')} disabled={updating}>
                <X size={14} /> Mark Bed Declined
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="section-header" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <Building2 size={18} color="var(--color-slate)" strokeWidth={2.4} /> Regional Partner Hospitals
        </div>
        <span className="badge badge-brand">{facilities.length} Centers Online</span>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 260 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {facilities.map(f => (
            <div key={f.id} className="facility-card">
              <div className="flex-between mb-1">
                <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text-primary)' }}>{f.name}</div>
                {f.emergency_available ? (
                  <span className="badge badge-green">READY</span>
                ) : (
                  <span className="badge badge-amber">LIMITED</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
                {f.type} · {f.location}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14, fontWeight: 600 }}>
                <span><MapPin size={12} style={{ display: 'inline' }} /> {f.distance_km} km away</span>
                <span>🏥 <strong>{f.icu_beds}</strong> ICU Beds Ready</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleContact(f)}
                disabled={contacting === f.id}
              >
                {contacting === f.id ? 'Contacting Facility…' : 'Initiate Hospital Bed Alignment'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
