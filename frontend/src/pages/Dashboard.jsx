import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api';
import {
  Users, Calendar, Zap, Ambulance, Droplets,
  AlertTriangle, Clock, ArrowRight, RefreshCw, Plus,
  ChevronRight, Activity, ShieldAlert, Building2,
  PhoneCall, CheckCircle2, UserCheck
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
        <AlertTriangle size={16} /> Failed to load operations dashboard: {error}
        <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={load}>
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    </div>
  );

  const emergencyCases = data.active_cases?.filter(c => c.priority === 'EMERGENCY') || [];
  const urgentCount = data.active_cases?.filter(c => c.priority === 'URGENT').length || 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="page-title">
              <Activity size={24} color="var(--brand-red)" strokeWidth={2.4} />
              Operations Dashboard
            </div>
            <div className="page-subtitle">Central dispatch, multi-agency coordination &amp; live case response stream</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={load}>
              <RefreshCw size={14} /> Refresh Feed
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/emergency/new')}>
              <Plus size={15} strokeWidth={2.5} /> Initiate Emergency Case
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Operational Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 22 }}>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--brand-red)' }}>
            <div className="stat-icon" style={{ background: 'var(--color-emergency-bg)', color: 'var(--brand-red)' }}>
              <Zap size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div className="stat-value" style={{ color: 'var(--brand-red)' }}>{data.active_emergencies}</div>
              <div className="stat-label">Active Emergencies</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid var(--color-urgent)' }}>
            <div className="stat-icon" style={{ background: 'var(--color-urgent-bg)', color: 'var(--color-urgent)' }}>
              <Ambulance size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value">{data.ambulance_requests}</div>
              <div className="stat-label">Ambulance Dispatches</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid var(--color-plum)' }}>
            <div className="stat-icon" style={{ background: 'var(--color-plum-bg)', color: 'var(--color-plum)' }}>
              <Droplets size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value">{data.blood_requests}</div>
              <div className="stat-label">Blood Orders</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid var(--color-slate)' }}>
            <div className="stat-icon" style={{ background: 'var(--color-slate-bg)', color: 'var(--color-slate)' }}>
              <Calendar size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value">{data.today_appointments}</div>
              <div className="stat-label">Today's Schedule</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid var(--color-stone)' }}>
            <div className="stat-icon" style={{ background: 'var(--color-stone-bg)', color: 'var(--color-stone-text)' }}>
              <Users size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value">{data.total_patients}</div>
              <div className="stat-label">Registered Patients</div>
            </div>
          </div>
        </div>

        {/* Action Required Alert Banner */}
        {emergencyCases.length > 0 && (
          <div className="alert alert-danger" style={{ marginBottom: 22, borderLeft: '5px solid var(--brand-red)', background: '#FDF2F1' }}>
            <span className="pulse-dot" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
              <strong style={{ color: 'var(--brand-red-text)', fontSize: 13.5 }}>Immediate Attention Required:</strong>
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong>{emergencyCases.length} Critical Emergency Case(s)</strong> are awaiting ambulance dispatch or hospital reception confirmation.
              </span>
            </div>
            <button
              className="btn btn-sm btn-primary"
              style={{ marginLeft: 'auto', background: 'var(--brand-red)' }}
              onClick={() => navigate('/emergency')}
            >
              Open Command Center <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Active Emergency Operations Stream */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden', borderTop: '3px solid var(--brand-red)' }}>
            <div style={{
              padding: '16px 22px',
              background: 'var(--bg-secondary)',
              borderBottom: '1.5px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="section-title" style={{ margin: 0, fontSize: 15 }}>
                  <Zap size={18} color="var(--brand-red)" strokeWidth={2.4} />
                  Active Emergency Coordination Cases
                </span>
                {data.active_emergencies > 0 && (
                  <span className="badge badge-brand">{data.active_emergencies} Active</span>
                )}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/emergency')}>
                View Full Command Center <ArrowRight size={13} />
              </button>
            </div>

            {data.active_cases?.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={36} color="var(--color-success)" />
                <h3>No Active Emergency Cases</h3>
                <p>All hospital coordination requests are resolved or closed.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 120 }}>Case Ref</th>
                      <th>Patient Identification</th>
                      <th style={{ width: 120 }}>Priority</th>
                      <th>Operational Status</th>
                      <th>Ambulance Unit</th>
                      <th>Blood Supply</th>
                      <th style={{ width: 110 }}>Elapsed Time</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.active_cases.map((c) => (
                      <tr key={c.id} className="clickable-row" onClick={() => navigate(`/emergency/${c.id}`)}>
                        <td>
                          <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-slate-text)', background: 'var(--color-slate-bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-slate-border)' }}>
                            {c.case_ref}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{c.full_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {c.blood_group ? <span className="font-bold" style={{ color: 'var(--brand-red)' }}>{c.blood_group} · </span> : ''}
                            {c.pickup_location || 'Location unspecified'}
                          </div>
                        </td>
                        <td><span className={priorityBadge(c.priority)}>{c.priority}</span></td>
                        <td><span className={caseStatusBadge(c.status)}>{caseStatusLabel(c.status)}</span></td>
                        <td>
                          {c.amb_status ? (
                            <div>
                              <span className={ambStatusBadge(c.amb_status)}>{c.amb_status}</span>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{c.amb_provider || ''}</div>
                            </div>
                          ) : (
                            <span className="text-muted text-xs font-medium">Not Requested</span>
                          )}
                        </td>
                        <td>
                          {c.blood_required ? (
                            c.blood_status ? (
                              <span className={bloodStatusBadge(c.blood_status)}>{c.blood_status}</span>
                            ) : (
                              <span className="badge badge-urgent">REQUIRED</span>
                            )
                          ) : (
                            <span className="text-muted text-xs font-medium">Not Required</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: c.priority === 'EMERGENCY' ? 'var(--brand-red)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>
                            <Clock size={13} />
                            {formatDuration(c.created_at)}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <ChevronRight size={16} color="var(--text-muted)" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Today's Appointments & Quick Operations Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 16 }}>
            {/* Appointments Breakdown Card */}
            <div className="card">
              <div className="section-header" style={{ marginBottom: 14 }}>
                <div className="section-title">
                  <Calendar size={17} color="var(--color-slate)" strokeWidth={2.2} />
                  Today's Appointment Breakdown
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/appointments')}>
                  Manage <ArrowRight size={12} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {data.appointments_by_status?.length > 0 ? (
                  data.appointments_by_status.map((s) => (
                    <div
                      key={s.status}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>{s.count}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 700, textTransform: 'uppercase' }}>
                        {s.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', gridColumn: '1 / -1', padding: '12px 0' }}>
                    No appointments scheduled for today.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Multi-Agency Operations Grid */}
            <div className="card">
              <div className="section-title mb-3" style={{ marginBottom: 14 }}>
                <Activity size={17} color="var(--brand-red)" strokeWidth={2.2} />
                Agency Quick Links
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', textAlign: 'left', padding: '10px 14px' }}
                  onClick={() => navigate('/ambulance')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 13 }}>
                    <Ambulance size={16} color="var(--color-urgent)" strokeWidth={2.2} />
                    Ambulance Transport Fleet
                  </span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', textAlign: 'left', padding: '10px 14px' }}
                  onClick={() => navigate('/blood')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 13 }}>
                    <Droplets size={16} color="var(--color-plum)" strokeWidth={2.2} />
                    Blood Inventory Matcher
                  </span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', textAlign: 'left', padding: '10px 14px' }}
                  onClick={() => navigate('/facilities')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 13 }}>
                    <Building2 size={16} color="var(--color-slate)" strokeWidth={2.2} />
                    Hospital &amp; ICU Beds Directory
                  </span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="page-body" style={{ paddingTop: 26 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 22 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 82 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 300 }} />
    </div>
  );
}
