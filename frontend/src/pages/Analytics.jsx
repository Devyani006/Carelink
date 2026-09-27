import { useEffect, useState } from 'react';
import { getAnalytics } from '../api';
import { BarChart3, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const STATUS_COLORS = {
  BOOKED: '#3b82f6', 'CHECKED-IN': '#06b6d4', WAITING: '#f59e0b',
  'IN-CONSULTATION': '#f97316', COMPLETED: '#10b981', CANCELLED: '#6b7280',
  CREATED: '#6b7280', ACKNOWLEDGED: '#3b82f6', AMBULANCE_REQUESTED: '#f59e0b',
  AMBULANCE_ASSIGNED: '#f97316', EN_ROUTE: '#f97316', ARRIVED: '#8b5cf6',
  TRANSFERRED: '#06b6d4', RECEIVED: '#8b5cf6', CLOSED: '#10b981',
};

const PRIORITY_COLORS = { EMERGENCY: '#ef4444', URGENT: '#f97316', ROUTINE: '#3b82f6' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontSize: 12, color: p.color }}>{p.name}: {p.value}</div>
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
    try { setData(await getAnalytics()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="page-body" style={{ paddingTop: 24 }}><div className="skeleton" style={{ height: 400 }} /></div>;
  if (error) return <div className="page-header"><div className="alert alert-danger"><AlertTriangle size={14} /> {error}</div></div>;
  if (!data) return null;

  const apptData = data.appointments_by_status?.map(d => ({
    name: d.status, count: d.count, fill: STATUS_COLORS[d.status] || '#6b7280'
  })) || [];

  const caseStatusData = data.cases_by_status?.map(d => ({
    name: d.status, value: d.count, fill: STATUS_COLORS[d.status] || '#6b7280'
  })) || [];

  const priorityData = data.cases_by_priority?.map(d => ({
    name: d.priority, value: d.count, fill: PRIORITY_COLORS[d.priority] || '#6b7280'
  })) || [];

  const statsCards = [
    { label: 'Total Ambulance Requests', value: data.total_ambulance_requests, color: '#f97316' },
    { label: 'Total Blood Requests', value: data.total_blood_requests, color: '#8b5cf6' },
    { label: 'Avg Coordination Time', value: data.avg_coordination_minutes ? `${data.avg_coordination_minutes}m` : 'N/A', color: '#06b6d4' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div>
            <div className="page-title">Analytics</div>
            <div className="page-subtitle">Coordination metrics overview</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {statsCards.map(s => (
            <div key={s.label} className="stat-card">
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: s.color, letterSpacing: -1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Appointments by Status */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 16 }}>Appointments by Status</div>
            {apptData.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}><p>No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={apptData} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {apptData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Emergency Priority */}
          <div className="card">
            <div className="section-title mb-3" style={{ marginBottom: 16 }}>Emergency Case Priority</div>
            {priorityData.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}><p>No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={priorityData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80}
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {priorityData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Emergency cases by status */}
        <div className="card">
          <div className="section-title mb-3" style={{ marginBottom: 16 }}>Emergency Cases by Status</div>
          {caseStatusData.length === 0 ? (
            <div className="empty-state"><p>No data</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={caseStatusData} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
