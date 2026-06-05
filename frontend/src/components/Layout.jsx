import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationsBell from './NotificationsBell.jsx';

const links = [
  { to: '/app', label: 'Map', end: true },
  { to: '/my-properties', label: 'My Inventory' },
  { to: '/leads', label: 'Co-broking Leads' },
  { to: '/matches', label: 'Matches' },
  { to: '/crm', label: 'CRM' },
  { to: '/renewals', label: 'Renewals' },
  { to: '/account', label: 'Account' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Prevent body scroll while the drawer is open on mobile.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <nav className="navbar">
        <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>
        <div className="brand">
          <span className="logo">📍</span> Broker<span className="full">Net</span>
        </div>
        <div className="nav-links nav-desktop">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="nav-right">
          <NotificationsBell />
          <span className="badge blue plan-badge" title={`${user?.subscription?.tier} plan`}>
            {user?.subscription?.tier === 'paid' ? '★ Paid' : 'Free'}
          </span>
          <button className="btn secondary small logout-btn" onClick={logout}>Logout</button>
        </div>
      </nav>

      {/* Mobile left drawer */}
      <div className={`drawer-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
      <aside className={`drawer ${menuOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <div className="brand"><span className="logo">📍</span> BrokerNet</div>
          <button className="close" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button>
        </div>
        <div className="drawer-user">
          <div className="drawer-avatar">{(user?.name || 'B').charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 700 }}>{user?.name}</div>
            <div className="tiny muted">{user?.agency || user?.email}</div>
          </div>
        </div>
        <nav className="drawer-links">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="drawer-foot">
          <span className={`badge ${user?.subscription?.tier === 'paid' ? 'green' : 'gray'}`}>
            {user?.subscription?.tier === 'paid' ? '★ Paid plan' : 'Free plan'}
          </span>
          <button className="btn secondary block" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
