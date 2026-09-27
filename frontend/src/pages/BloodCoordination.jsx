import { useEffect, useState } from 'react';
import { searchBloodSources } from '../api';
import { Droplets, Shield, Search, RefreshCw } from 'lucide-react';
import { bloodFreshnessClass } from '../utils';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Whole Blood', 'Packed RBC', 'Platelets', 'Fresh Frozen Plasma'];

export default function BloodCoordination() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ blood_group: '', component: '', max_km: 15 });

  const load = async () => {
    setLoading(true);
    try {
      const data = await searchBloodSources({
        blood_group: filter.blood_group || undefined,
        component: filter.component || undefined,
        max_km: filter.max_km,
      });
      setSources(data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setFilter(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <div className="page-title">Blood Coordination</div>
            <div className="page-subtitle">Demo coordination data — not real blood bank availability</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      <div className="page-body">
        <div className="alert alert-warning mb-4" style={{ marginBottom: 20 }}>
          <Shield size={14} />
          This data is for demo coordination purposes only. Units and availability shown are not real-time blood bank data.
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 130 }} value={filter.blood_group} onChange={e => set('blood_group', e.target.value)}>
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
          <select className="form-select" style={{ width: 170 }} value={filter.component} onChange={e => set('component', e.target.value)}>
            <option value="">All Components</option>
            {COMPONENTS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="form-select" style={{ width: 130 }} value={filter.max_km} onChange={e => set('max_km', Number(e.target.value))}>
            <option value={5}>Within 5km</option>
            <option value={10}>Within 10km</option>
            <option value={15}>Within 15km</option>
            <option value={25}>Within 25km</option>
            <option value={50}>Within 50km</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={load}>
            <Search size={13} /> Search
          </button>
        </div>

        {/* Expand radius buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Expand search:</span>
          {[5, 10, 25].map(km => (
            <button key={km} className="btn btn-secondary btn-sm" onClick={() => { set('max_km', filter.max_km + km); setTimeout(load, 100); }}>
              +{km}km
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
          </div>
        ) : sources.length === 0 ? (
          <div className="empty-state">
            <Droplets size={40} />
            <h3>No sources found</h3>
            <p>Try expanding search radius or removing filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {sources.map(s => (
              <div key={s.id} className="card card-sm">
                <div className="flex-between mb-2">
                  <span style={{ fontWeight: 700, fontSize: 12, background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '2px 8px', borderRadius: 5 }}>{s.blood_group}</span>
                  <span className={`text-xs font-semibold ${bloodFreshnessClass(s.freshness)}`}>● {s.freshness}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{s.type} · {s.location}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                  <span><strong style={{ color: 'var(--text-primary)' }}>{s.units_available}u</strong> <span style={{ color: 'var(--text-muted)' }}>{s.component}</span></span>
                  <span style={{ color: 'var(--text-muted)' }}>📍 {s.distance_km}km</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.contact}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
