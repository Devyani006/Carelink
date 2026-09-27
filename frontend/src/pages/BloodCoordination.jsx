import { useEffect, useState } from 'react';
import { searchBloodSources } from '../api';
import { Droplets, Search, RefreshCw, MapPin, Phone, HeartPulse, CheckCircle2 } from 'lucide-react';
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
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="page-title">
              <Droplets size={22} color="var(--color-plum)" strokeWidth={2.4} />
              Blood Supply Coordination
            </div>
            <div className="page-subtitle">Real-time inventory lookup across regional blood banks, component matching &amp; unit reservation</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={14} /> Refresh Bank Inventory
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 160 }}
            value={filter.blood_group}
            onChange={e => set('blood_group', e.target.value)}
          >
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>

          <select
            className="form-select"
            style={{ width: 190 }}
            value={filter.component}
            onChange={e => set('component', e.target.value)}
          >
            <option value="">All Components</option>
            {COMPONENTS.map(c => <option key={c}>{c}</option>)}
          </select>

          <select
            className="form-select"
            style={{ width: 150 }}
            value={filter.max_km}
            onChange={e => set('max_km', Number(e.target.value))}
          >
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={15}>Within 15 km</option>
            <option value={25}>Within 25 km</option>
            <option value={50}>Within 50 km</option>
          </select>

          <button className="btn btn-primary btn-sm" onClick={load}>
            <Search size={14} strokeWidth={2.5} /> Search Blood Banks
          </button>

          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            {[5, 10, 25].map(km => (
              <button
                key={km}
                className="btn btn-secondary btn-sm"
                onClick={() => { set('max_km', filter.max_km + km); setTimeout(load, 100); }}
              >
                +{km}km
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 130 }} />)}
          </div>
        ) : sources.length === 0 ? (
          <div className="empty-state">
            <Droplets size={40} color="var(--color-plum)" />
            <h3>No inventory units located</h3>
            <p>Try widening the search distance or selecting an alternate component type.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {sources.map(s => (
              <div key={s.id} className="card card-sm">
                <div className="flex-between mb-1">
                  <span className="badge badge-red font-extrabold">{s.blood_group}</span>
                  <span className={`text-xs font-bold ${bloodFreshnessClass(s.freshness)}`}>
                    ● {s.freshness}
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 500 }}>
                  {s.type} · {s.location}
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <span><strong style={{ color: 'var(--brand-red)' }}>{s.units_available} Units</strong> ({s.component})</span>
                  <span><MapPin size={12} style={{ display: 'inline' }} /> {s.distance_km} km</span>
                </div>
                {s.contact && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Phone size={11} /> {s.contact}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
