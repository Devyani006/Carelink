import { useEffect, useState } from 'react';
import { getFacilities } from '../api';
import { Building2, Shield, RefreshCw, MapPin } from 'lucide-react';

export default function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setFacilities(await getFacilities()); }
    catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <div className="page-title">Facilities</div>
            <div className="page-subtitle">Demo coordination data — verify availability before dispatch</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      <div className="page-body">
        <div className="alert alert-warning mb-4" style={{ marginBottom: 20 }}>
          <Shield size={14} />
          Facility availability and bed counts shown are demo coordination data. Always confirm with the facility directly before sending a patient.
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
          </div>
        ) : facilities.length === 0 ? (
          <div className="empty-state">
            <Building2 size={40} />
            <h3>No facilities</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {facilities.map(f => (
              <div key={f.id} className="card">
                <div className="flex-between mb-3">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{f.type}</div>
                  </div>
                  {f.emergency_available
                    ? <span className="badge badge-green">EMERGENCY AVAILABLE</span>
                    : <span className="badge badge-amber">LIMITED</span>
                  }
                </div>

                <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {f.location}
                  </span>
                  <span>{f.distance_km}km away</span>
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>🏥 {f.icu_beds} ICU beds (demo)</span>
                  <span>📞 {f.contact}</span>
                </div>

                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                  Last verified: {new Date(f.last_verified + 'Z').toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
