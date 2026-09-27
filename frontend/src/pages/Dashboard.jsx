import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api';
import {
  Users, Calendar, Zap, Ambulance, Droplets,
  AlertTriangle, Clock, ArrowRight, RefreshCw
} from 'lucide-react';
import {
  priorityBadge, caseStatusBadge, ambStatusBadge,
  bloodStatusBadge, formatDuration, caseStatusLabel
} from '../utils';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getDashboard();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return (
    <div className="page-header">
      <div className="alert alert-danger">
        <AlertTriangle size={16} /> Failed to load dashboard: {error}
        <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={load}>
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    </div>
  );

  const stats = [
    { label: 'Total Patients', value: data.total_patients, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { label: "Today's Appointments", value: data.today_appointments, icon: Calendar, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
    { label: 'Active Emergencies', value: data.active_emergencies, icon: Zap, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    { label: 'Ambulance Requests', value: data.ambulance_requests, icon: Ambulance, color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    { label: 'Blood Requests', value: data.blood_requests, icon: Droplets, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex-between">
          <div>
            <div className="page-title">Operations Dashboard</div>
            <div className="page-subtitle">Real-time coordination overview</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Required */}
        {data.active_cases?.some(c => c.priority === 'EMERGENCY') && (
          <div className="alert alert-danger mb-4" style={{ marginBottom: 20 }}>
            <span className="pulse-dot" />
            <strong>Action Required:</strong> {data.active_cases.filter(c => c.priority === 'EMERGENCY').length} EMERGENCY case(s) require immediate coordination attention.
          </div>
        )}

        {/* Active Emergency Cases */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="#ef4444" />
              <span className="section-title" style={{ margin: 0 }}>Active Emergency Cases</span>
              {data.active_emergencies > 0 && (
                <span className="badge badge-red">{data.active_emergencies}</span>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/emergency')}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          {data.active_cases?.length === 0 ? (
            <div className="empty-state">
              <Zap size={32} />
              <h3>No Active Emergencies</h3>
              <p>All coordination cases are resolved or closed.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Patient</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Ambulance</th>
                    <th>Blood</th>
                    <th>Duration</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.active_cases.map((c) => (
                    <tr key={c.id} className="clickable-row" onClick={() => navigate(`/emergency/${c.id}`)}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#60a5fa' }}>{c.case_ref}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{c.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.blood_group}</div>
                      </td>
                      <td><span className={priorityBadge(c.priority)}>{c.priority}</span></td>
                      <td><span className={caseStatusBadge(c.status)}>{caseStatusLabel(c.status)}</span></td>
                      <td>
                        {c.amb_status
                          ? <span className={ambStatusBadge(c.amb_status)}>{c.amb_status}</span>
                          : <span className="text-muted text-xs">Not requested</span>
                        }
                      </td>
                      <td>
                        {c.blood_required
                          ? c.blood_status
                            ? <span className={bloodStatusBadge(c.blood_status)}>{c.blood_status}</span>
                            : <span className="badge badge-amber">REQUIRED</span>
                          : <span className="text-muted text-xs">Not required</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                          <Clock size={12} />
                          {formatDuration(c.created_at)}
                        </div>
                      </td>
                      <td>
                        <ArrowRight size={14} color="var(--text-muted)" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Appointments quick summary */}
        {data.appointments_by_status?.length > 0 && (
          <div className="card mt-4" style={{ marginTop: 20 }}>
            <div className="section-header">
              <div className="section-title"><Calendar size={15} /> Today's Appointment Summary</div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {data.appointments_by_status.map((s) => (
                <div key={s.status} style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  minWidth: 100,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{s.count}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="page-body" style={{ paddingTop: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 84 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 300 }} />
    </div>
  );
}
