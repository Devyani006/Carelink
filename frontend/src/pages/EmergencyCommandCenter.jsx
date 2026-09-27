import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmergencyCases } from '../api';
import { Zap, Clock, AlertTriangle, RefreshCw, Plus, Filter } from 'lucide-react';
import {
  priorityBadge, caseStatusBadge, ambStatusBadge, bloodStatusBadge,
  formatDuration, caseStatusLabel
} from '../utils';

const STATUSES = ['CREATED', 'ACKNOWLEDGED', 'AMBULANCE_REQUESTED', 'AMBULANCE_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'TRANSFERRED', 'RECEIVED', 'CLOSED'];

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
      {/* Command header */}
      <div className="command-header">
        <div className="command-title">Emergency Coordination Platform</div>
        <div className="flex-between">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
              Command Center
              {emergencyCount > 0 && (
                <span style={{ marginLeft: 10 }}>
                  <span className="pulse-dot" />
                </span>
              )}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {cases.length} {filter === 'active' ? 'active' : ''} case{cases.length !== 1 ? 's' : ''} · Last updated just now
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={load}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button className="btn btn-danger" onClick={() => navigate('/emergency/new')}>
              <Zap size={14} /> New Emergency Case
            </button>
          </div>
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: 20 }}>
        {/* Alert banner */}
        {emergencyCount > 0 && (
          <div className="alert alert-danger mb-4" style={{ marginBottom: 16 }}>
            <span className="pulse-dot" style={{ marginRight: 4 }} />
            <strong>{emergencyCount} EMERGENCY priority case(s)</strong> require immediate coordination action.
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border-light)', paddingBottom: 0 }}>
          {[
            { key: 'active', label: 'Active Cases' },
            { key: 'all', label: 'All Cases' },
            { key: 'CLOSED', label: 'Closed' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 16px', fontSize: 13, fontWeight: 600,
                color: filter === tab.key ? '#60a5fa' : 'var(--text-muted)',
                borderBottom: filter === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger mb-4"><AlertTriangle size={14} /> {error}</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
          </div>
        ) : cases.length === 0 ? (
          <div className="empty-state">
            <Zap size={40} />
            <h3>No cases found</h3>
            <p>Create a new emergency coordination case to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cases.map((c) => (
              <CaseCard key={c.id} c={c} onClick={() => navigate(`/emergency/${c.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CaseCard({ c, onClick }) {
  const isPriority = c.priority === 'EMERGENCY';
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isPriority ? 'rgba(239,68,68,0.3)' : 'var(--border-light)'}`,
        borderLeft: `3px solid ${isPriority ? '#ef4444' : c.priority === 'URGENT' ? '#f97316' : '#3b82f6'}`,
        borderRadius: 10,
        padding: '14px 18px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = isPriority ? 'rgba(239,68,68,0.5)' : '#2a4a70'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isPriority ? 'rgba(239,68,68,0.3)' : 'var(--border-light)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1 }}>
          {/* Case ID + Patient */}
          <div style={{ minWidth: 140 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#60a5fa', fontWeight: 600 }}>{c.case_ref}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{c.full_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.blood_group || 'N/A'} · {c.pickup_location || '—'}</div>
          </div>

          {/* Priority + Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <span className={priorityBadge(c.priority)}>{c.priority}</span>
            <span className={caseStatusBadge(c.status)}>{caseStatusLabel(c.status)}</span>
          </div>

          {/* Ambulance */}
          <div style={{ minWidth: 130 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>AMBULANCE</div>
            {c.amb_status
              ? <><span className={ambStatusBadge(c.amb_status)}>{c.amb_status}</span>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.amb_provider || '—'}</div></>
              : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not requested</span>
            }
          </div>

          {/* Blood */}
          <div style={{ minWidth: 110 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>BLOOD</div>
            {c.blood_required
              ? c.blood_status
                ? <span className={bloodStatusBadge(c.blood_status)}>{c.blood_status}</span>
                : <span className="badge badge-amber">REQUIRED</span>
              : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not required</span>
            }
          </div>

          {/* Duration */}
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>DURATION</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: isPriority ? '#fca5a5' : 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>
              <Clock size={13} />
              {formatDuration(c.created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
