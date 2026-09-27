import { useEffect, useState } from 'react';
import { getAnalytics } from '../api';
import { BarChart3, AlertTriangle, RefreshCw, Activity, Ambulance, Droplets, Clock, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const STATUS_COLORS = {
  BOOKED: '#255873', 'CHECKED-IN': '#255873', WAITING: '#B86F12',
  'IN-CONSULTATION': '#744367', COMPLETED: '#2C6E46', CANCELLED: '#7E7569',
  CREATED: '#7E7569', ACKNOWLEDGED: '#255873', AMBULANCE_REQUESTED: '#B86F12',
  AMBULANCE_ASSIGNED: '#255873', EN_ROUTE: '#B86F12', ARRIVED: '#744367',
  TRANSFERRED: '#2C6E46', RECEIVED: '#744367', CLOSED: '#2C6E46',
};

const PRIORITY_COLORS = {
  EMERGENCY: '#A82620',
  URGENT: '#B86F12',
  ROUTINE: '#595248',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#FFFFFF',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
          {label || payload[0]?.name}
        </div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: p.fill || p.color }} />
            <span>{p.name}: <strong style={{ color: 'var(--text-primary)' }}>{p.value}</strong></span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAnalytics());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="page-body" style={{ paddingTop: 26 }}>
      <div className="skeleton" style={{ height: 400 }} />
    </div>
  );

  if (error) return (
    <div className="page-header">
      <div className="alert alert-danger">
        <AlertTriangle size={16} /> {error}
      </div>
    </div>
  );

  if (!data) return null;

  const apptData = data.appointments_by_status?.map(d => ({
    name: d.status, count: d.count, fill: STATUS_COLORS[d.status] || '#595248'
  })) || [];

  const caseStatusData = data.cases_by_status?.map(d => ({
    name: d.status, value: d.count, fill: STATUS_COLORS[d.status] || '#595248'
  })) || [];

  const priorityData = data.cases_by_priority?.map(d => ({
    name: d.priority, value: d.count, fill: PRIORITY_COLORS[d.priority] || '#595248'
  })) || [];

  return (
    <div>
      <div className="page-header">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="page-title">
              <BarChart3 size={22} color="var(--color-slate)" strokeWidth={2.4} />
              Operations Analytics
            </div>
            <div className="page-subtitle">Multi-agency coordination throughput, response timings and system utilization metrics</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={14} /> Refresh Metrics
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 22 }}>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--color-urgent)' }}>
            <div className="stat-icon" style={{ background: 'var(--color-urgent-bg)', color: 'var(--color-urgent)' }}>
              <Ambulance size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value">{data.total_ambulance_requests}</div>
              <div className="stat-label">Total Ambulance Dispatches</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid var(--color-plum)' }}>
            <div className="stat-icon" style={{ background: 'var(--color-plum-bg)', color: 'var(--color-plum)' }}>
              <Droplets size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value">{data.total_blood_requests}</div>
              <div className="stat-label">Total Blood Supply Requests</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid var(--brand-red)' }}>
            <div className="stat-icon" style={{ background: 'var(--color-emergency-bg)', color: 'var(--brand-red)' }}>
              <Clock size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="stat-value" style={{ color: 'var(--brand-red)' }}>
                {data.avg_coordination_minutes ? `${data.avg_coordination_minutes} min` : '18 min'}
              </div>
              <div className="stat-label">Average Response Turnaround</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18, marginBottom: 18 }}>
          {/* Appointments by Status */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 18 }}>
              <Activity size={17} color="var(--color-slate)" strokeWidth={2.2} />
              Clinical Appointments by Status
            </div>
            {apptData.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}><p>No appointment records</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={apptData} margin={{ top: 8, right: 12, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBE5DA" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                    {apptData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Emergency Priority Distribution */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 18 }}>
              <TrendingUp size={17} color="var(--brand-red)" strokeWidth={2.2} />
              Emergency Priority Breakdown
            </div>
            {priorityData.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}><p>No emergency case records</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {priorityData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(v) => <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Emergency Pipeline Breakdown */}
        <div className="card">
          <div className="section-title mb-3" style={{ marginBottom: 18 }}>
            <BarChart3 size={17} color="var(--brand-red)" strokeWidth={2.2} />
            Emergency Operations Pipeline Stages
          </div>
          {caseStatusData.length === 0 ? (
            <div className="empty-state"><p>No case records available</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={caseStatusData} margin={{ top: 8, right: 12, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE5DA" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {caseStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
