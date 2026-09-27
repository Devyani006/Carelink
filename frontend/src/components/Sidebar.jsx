import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Zap, Ambulance,
  Droplets, Building2, BarChart3, Heart, Shield
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
  { to: '/patients', icon: Users, label: 'Patients', section: 'main' },
  { to: '/appointments', icon: Calendar, label: 'Appointments', section: 'main' },
  { to: '/emergency', icon: Zap, label: 'Command Center', section: 'emergency', emergency: true },
  { to: '/ambulance', icon: Ambulance, label: 'Ambulance', section: 'emergency' },
  { to: '/blood', icon: Droplets, label: 'Blood Coordination', section: 'emergency' },
  { to: '/facilities', icon: Building2, label: 'Facilities', section: 'emergency' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', section: 'reports' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Heart size={18} color="white" />
        </div>
        <div>
          <div className="sidebar-logo-text">CareLink</div>
          <div className="sidebar-logo-sub">Healthcare Coordination</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ paddingTop: 8 }}>
        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Overview</div>
        {navItems
          .filter((n) => n.section === 'main')
          .map((item) => (
            <NavItem key={item.to} {...item} />
          ))}

        <div className="sidebar-section-label" style={{ marginTop: 16 }}>Emergency Ops</div>
        {navItems
          .filter((n) => n.section === 'emergency')
          .map((item) => (
            <NavItem key={item.to} {...item} />
          ))}

        <div className="sidebar-section-label" style={{ marginTop: 16 }}>Reports</div>
        {navItems
          .filter((n) => n.section === 'reports')
          .map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
      </nav>

      {/* Bottom disclaimer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-light)',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: 8,
            padding: '8px 10px',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          <Shield size={12} style={{ color: '#fca5a5', marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 10, color: '#fca5a5', lineHeight: 1.5 }}>
            Ambulance, blood &amp; facility data shown is demo coordination data only. Not live emergency services.
          </p>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ to, icon: Icon, label, emergency }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `nav-item${emergency ? ' emergency' : ''}${isActive ? ' active' : ''}`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}
