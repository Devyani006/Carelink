import { useEffect, useState } from 'react';
import { getAmbulances, getAvailableAmbulances } from '../api';
import { Ambulance, Shield, RefreshCw } from 'lucide-react';
import { ambStatusBadge } from '../utils';

export default function AmbulancePage() {
  const [requests, setRequests] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <div className="flex-between">
          <div>
            <div className="page-title">Ambulance Coordination</div>
            <div className="page-subtitle">Demo coordination data only — not a real dispatch system</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      <div className="page-body">
        <div className="alert alert-warning mb-4" style={{ marginBottom: 20 }}>
          <Shield size={14} />
          This module shows demo coordination data for hackathon purposes. It is not connected to real ambulance dispatch or emergency services.
        </div>

        {/* Available Fleet */}
        <div className="section-header mb-4" style={{ marginBottom: 16 }}>
          <div className="section-title"><Ambulance size={16} /> Coordination Fleet (Demo)</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {available.map(a => (
            <div key={a.id} className="card card-sm">
              <div className="flex-between mb-2">
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{a.provider}</div>
                {a.available
                  ? <span className="badge badge-green">AVAILABLE</span>
                  : <span className="badge badge-gray">BUSY</span>
                }
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{a.type}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{a.vehicle}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                📍 {a.distance_km}km · ETA ~{a.eta_min}min
              </div>
            </div>
          ))}
        </div>

        {/* Active Requests */}
        <div className="section-header mb-4" style={{ marginBottom: 16 }}>
          <div className="section-title">Active Ambulance Requests</div>
          <span className="badge badge-blue">{requests.length}</span>
        </div>

        {loading ? <div className="skeleton" style={{ height: 200 }} /> :
          requests.length === 0 ? (
            <div className="empty-state">
              <Ambulance size={32} />
              <h3>No active requests</h3>
              <p>Ambulance requests created from emergency cases appear here.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Provider</th>
                    <th>Type</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Distance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#60a5fa' }}>{r.case_ref}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.provider || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.ambulance_type || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.vehicle_number || '—'}</td>
                      <td>{r.driver_name || '—'}</td>
                      <td>{r.distance_km ? `${r.distance_km}km` : '—'}</td>
                      <td><span className={ambStatusBadge(r.status)}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}
