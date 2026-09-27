import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Zap, Ambulance,
  Droplets, Building2, BarChart3, Activity, ArrowLeft
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
  { to: '/patients', icon: Users, label: 'Patient Directory', section: 'main' },
  { to: '/appointments', icon: Calendar, label: 'Appointments', section: 'main' },
  { to: '/emergency', icon: Zap, label: 'Command Center', section: 'emergency', emergency: true, badge: 'OPS' },
  { to: '/ambulance', icon: Ambulance, label: 'Ambulance Dispatch', section: 'emergency' },
  { to: '/blood', icon: Droplets, label: 'Blood Coordination', section: 'emergency' },
  { to: '/facilities', icon: Building2, label: 'Hospital Facilities', section: 'emergency' },
  { to: '/analytics', icon: BarChart3, label: 'Operations Analytics', section: 'reports' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Red CareLink Brand Header */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Activity size={22} strokeWidth={2.4} />
        </div>
        <div>
          <div className="sidebar-logo-text">CareLink</div>
          <div className="sidebar-logo-sub">Healthcare Ops</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Console</div>
        {navItems
          .filter((n) => n.section === 'main')
          .map((item) => (
            <NavItem key={item.to} {...item} />
          ))}

        <div className="sidebar-section-label">Emergency Operations</div>
        {navItems
          .filter((n) => n.section === 'emergency')
          .map((item) => (
            <NavItem key={item.to} {...item} />
          ))}

        <div className="sidebar-section-label">Intelligence</div>
        {navItems
          .filter((n) => n.section === 'reports')
          .map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
      </nav>

      {/* Understated Operations Status footer */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-light)',
          marginTop: 'auto',
          background: 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--color-success)',
              boxShadow: '0 0 0 2px rgba(44, 110, 70, 0.2)',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>System Live</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-red)', letterSpacing: 0.5 }}>ONLINE</span>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ to, icon: Icon, label, emergency, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `nav-item${emergency ? ' emergency' : ''}${isActive ? ' active' : ''}`
      }
    >
      <Icon size={18} strokeWidth={2.2} className="nav-icon" />
      <span>{label}</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </NavLink>
  );
}
