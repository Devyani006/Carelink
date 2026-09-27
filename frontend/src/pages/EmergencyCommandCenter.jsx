import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmergencyCases } from '../api';
import { Zap, Clock, AlertTriangle, RefreshCw, Plus, ArrowRight, Ambulance, Droplets, Building2, Activity, User, MapPin } from 'lucide-react';
import {
  priorityBadge, caseStatusBadge, ambStatusBadge, bloodStatusBadge,
  formatDuration, caseStatusLabel
} from '../utils';

export default function EmergencyCommandCenter() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let status;
      if (filter === 'active') status = undefined;
      else if (filter === 'closed') status = 'CLOSED';
      else status = filter;
      const data = await getEmergencyCases(status);
      if (filter === 'active') {
        setCases(data.filter(c => !['CLOSED', 'RECEIVED'].includes(c.status)));
      } else {
        setCases(data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const emergencyCount = cases.filter(c => c.priority === 'EMERGENCY').length;

  return (
    <div>
      {/* Command Header */}
      <div className="command-header">
        <div className="command-title">
          <Zap size={15} strokeWidth={2.6} />
          Hospital Emergency Console
        </div>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.6, display: 'flex', alignItems: 'center', gap: 10 }}>
              Emergency Command Center
              {emergencyCount > 0 && (
                <span className="pulse-dot" title="Active emergency cases pending" />
              )}
            </h1>
            <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 3, fontWeight: 500 }}>
              Live dispatch &amp; operational oversight: <strong>{cases.length} {filter === 'active' ? 'active' : ''} case(s)</strong> under multi-agency management
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={load}>
              <RefreshCw size={14} /> Refresh Stream
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/emergency/new')}>
              <Plus size={15} strokeWidth={2.5} /> New Emergency Case
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Urgent Action Banner */}
        {emergencyCount > 0 && filter === 'active' && (
          <div className="alert alert-danger" style={{ marginBottom: 18, borderLeft: '5px solid var(--brand-red)' }}>
            <span className="pulse-dot" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--brand-red-text)', fontSize: 13.5 }}>{emergencyCount} Critical EMERGENCY Case(s):</strong>
              <span>Immediate dispatch, blood matching or facility confirmation is actively pending.</span>
            </div>
          </div>
        )}

        {/* Filter Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 18,
          borderBottom: '1.5px solid var(--border)',
          paddingBottom: 8,
        }}>
          {[
            { key: 'active', label: 'Active Coordination Cases' },
            { key: 'all', label: 'All Cases Archive' },
            { key: 'CLOSED', label: 'Closed & Fulfilled' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                background: filter === tab.key ? 'var(--bg-card)' : 'transparent',
                border: filter === tab.key ? '1.5px solid var(--border)' : '1.5px solid transparent',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: filter === tab.key ? 700 : 600,
                color: filter === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: filter === tab.key ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger mb-4"><AlertTriangle size={15} /> {error}</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 92 }} />)}
          </div>
        ) : cases.length === 0 ? (
          <div className="empty-state">
            <Activity size={40} color="var(--color-slate)" />
            <h3>No Coordination Cases in Current Filter</h3>
            <p>Initiate a new emergency coordination case to route ambulance, blood, and hospital resources.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cases.map((c) => (
              <CaseRowCard key={c.id} c={c} onClick={() => navigate(`/emergency/${c.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CaseRowCard({ c, onClick }) {
  const isEmergency = c.priority === 'EMERGENCY';
  const isUrgent = c.priority === 'URGENT';

  const borderLeftColor = isEmergency
    ? 'var(--brand-red)'
    : isUrgent
    ? 'var(--color-urgent)'
    : 'var(--border-dark)';

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `5px solid ${borderLeftColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-dark)';
        e.currentTarget.style.borderLeftColor = borderLeftColor;
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.borderLeftColor = borderLeftColor;
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        {/* Case ID & Patient */}
        <div style={{ minWidth: 190 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-slate-text)', background: 'var(--color-slate-bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-slate-border)' }}>
              {c.case_ref}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 3 }}>
            {c.full_name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            {c.blood_group ? <span className="font-bold" style={{ color: 'var(--brand-red)' }}>{c.blood_group} · </span> : ''}
            <MapPin size={11} color="var(--text-muted)" /> {c.pickup_location || 'Location unspecified'}
          </div>
        </div>

        {/* Priority & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 130 }}>
          <span className={priorityBadge(c.priority)}>{c.priority}</span>
          <span className={caseStatusBadge(c.status)}>{caseStatusLabel(c.status)}</span>
        </div>

        {/* Ambulance State with Icon */}
        <div style={{ minWidth: 140 }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Ambulance size={12} color="var(--color-urgent)" /> Ambulance Unit
          </div>
          {c.amb_status ? (
            <div>
              <span className={ambStatusBadge(c.amb_status)}>{c.amb_status}</span>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500 }}>
                {c.amb_provider || 'Assigned'}
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Not Requested</span>
          )}
        </div>

        {/* Blood State with Icon */}
        <div style={{ minWidth: 130 }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Droplets size={12} color="var(--color-plum)" /> Blood Supply
          </div>
          {c.blood_required ? (
            c.blood_status ? (
              <span className={bloodStatusBadge(c.blood_status)}>{c.blood_status}</span>
            ) : (
              <span className="badge badge-urgent">REQUIRED</span>
            )
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Not Required</span>
          )}
        </div>

        {/* Duration / Elapsed */}
        <div style={{ minWidth: 95, textAlign: 'right' }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
            Elapsed
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: isEmergency ? 'var(--brand-red)' : 'var(--text-primary)',
            fontSize: 13.5,
            fontWeight: 800
          }}>
            <Clock size={13} />
            {formatDuration(c.created_at)}
          </div>
        </div>

        {/* Action arrow */}
        <div style={{ color: 'var(--text-muted)' }}>
          <ArrowRight size={18} />
        </div>
      </div>
    </div>
  );
}
