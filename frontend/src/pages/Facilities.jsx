import { useEffect, useState } from 'react';
import { getFacilities } from '../api';
import { Building2, RefreshCw, MapPin, Phone, CheckCircle, Clock, HeartPulse } from 'lucide-react';

export default function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setFacilities(await getFacilities());
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
              <Building2 size={22} color="var(--color-slate)" strokeWidth={2.4} />
              Hospital Facilities Directory
            </div>
            <div className="page-subtitle">Partner hospital emergency rooms, trauma centers, ICU bed capacities &amp; verification telemetry</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={14} /> Refresh Directory
          </button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
          </div>
        ) : facilities.length === 0 ? (
          <div className="empty-state">
            <Building2 size={40} color="var(--color-slate)" />
            <h3>No hospital facility records available</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {facilities.map(f => (
              <div key={f.id} className="facility-card">
                <div className="flex-between mb-2">
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{f.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500 }}>{f.type}</div>
                  </div>
                  {f.emergency_available ? (
                    <span className="badge badge-green">EMERGENCY READY</span>
                  ) : (
                    <span className="badge badge-amber">LIMITED CAPACITY</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 18, fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={13} color="var(--text-muted)" /> {f.location}
                  </span>
                  <span>{f.distance_km} km away</span>
                </div>

                <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <span>🏥 <strong style={{ color: 'var(--brand-red)' }}>{f.icu_beds}</strong> ICU Beds Available</span>
                  {f.contact && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={12} color="var(--text-muted)" /> {f.contact}
                    </span>
                  )}
                </div>

                <div style={{
                  marginTop: 14,
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-light)',
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontWeight: 500
                }}>
                  <Clock size={12} />
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
