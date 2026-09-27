import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAmbulances, getAvailableAmbulances } from '../api';
import { Ambulance, RefreshCw, MapPin, Clock, ArrowRight, Activity, ShieldCheck, Radio } from 'lucide-react';
import { ambStatusBadge } from '../utils';

export default function AmbulancePage() {
  const [requests, setRequests] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [req, avail] = await Promise.all([getAmbulances(), getAvailableAmbulances()]);
      setRequests(req);
      setAvailable(avail);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-header">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="page-title">
              <Ambulance size={22} color="var(--color-urgent)" strokeWidth={2.4} />
              Ambulance Transport Fleet
            </div>
            <div className="page-subtitle">Emergency transport units, active GPS telemetry &amp; live case dispatch log</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={14} /> Refresh Fleet Feed
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Available Fleet Grid */}
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div className="section-title">
            <Radio size={17} color="var(--color-urgent)" strokeWidth={2.4} /> Coordinated Fleet Standby
          </div>
          <span className="badge badge-brand">{available.length} Units Ready</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 26 }}>
          {available.map(a => (
            <div key={a.id} className="card card-sm">
              <div className="flex-between mb-1">
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{a.provider}</div>
                {a.available ? (
                  <span className="badge badge-green">AVAILABLE</span>
                ) : (
                  <span className="badge badge-stone">BUSY</span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 2 }}>{a.type}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>{a.vehicle}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, display: 'flex', gap: 16, fontWeight: 600 }}>
                <span><MapPin size={12} style={{ display: 'inline' }} /> {a.distance_km} km away</span>
                <span><Clock size={12} style={{ display: 'inline' }} /> ETA ~{a.eta_min} min</span>
              </div>
            </div>
          ))}
        </div>

        {/* Active Dispatch Requests Log */}
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div className="section-title">
            <Activity size={17} color="var(--brand-red)" strokeWidth={2.4} /> Active Case Dispatches
          </div>
          <span className="badge badge-blue">{requests.length} Total Dispatches</span>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 220 }} />
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <Ambulance size={40} color="var(--color-urgent)" />
            <h3>No active ambulance dispatches</h3>
            <p>Dispatches created from emergency coordination cases will appear in this feed.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Case Ref</th>
                    <th>Transport Provider</th>
                    <th>Unit Specification</th>
                    <th>Vehicle Reg.</th>
                    <th>Assigned Driver</th>
                    <th>Routing Distance</th>
                    <th>Status</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr
                      key={r.id}
                      className="clickable-row"
                      onClick={() => r.case_id && navigate(`/emergency/${r.case_id}`)}
                    >
                      <td style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--color-slate-text)' }}>
                        {r.case_ref}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{r.provider || '—'}</td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{r.ambulance_type || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{r.vehicle_number || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{r.driver_name || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{r.distance_km ? `${r.distance_km} km` : '—'}</td>
                      <td><span className={ambStatusBadge(r.status)}>{r.status}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <ArrowRight size={16} color="var(--text-muted)" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
