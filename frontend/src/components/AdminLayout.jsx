import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axios';

const NAV = [
  {
    section: 'POINT OF SALE',
    color: '#1a0f0a',
    items: [
      { to: '/backend',        label: 'Dashboard',      icon: '⊞', exact: true },
      { to: '/backend/floors', label: 'Floors & Tables', icon: '🪑' },
    ],
  },
  {
    section: 'CATALOG',
    color: '#1d6fa4',
    items: [
      { to: '/backend/products',   label: 'Products',   icon: '🍽️' },
      { to: '/backend/categories', label: 'Categories', icon: '📂' },
    ],
  },
  {
    section: 'OPERATIONS',
    color: '#2d6a4f',
    items: [
      { to: '/backend/orders',    label: 'Orders',    icon: '📋' },
      { to: '/backend/payments',  label: 'Payments',  icon: '💳' },
      { to: '/backend/customers', label: 'Customers', icon: '👥' },
    ],
  },
  {
    section: 'ANALYTICS',
    color: '#d4a017',
    items: [
      { to: '/backend/reports', label: 'Reports', icon: '📊' },
    ],
  },
];

export default function AdminLayout({ title, children, actions }) {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/login');
  };

  const allItems    = NAV.flatMap((s) => s.items);
  const currentItem = allItems.find((i) =>
    i.exact ? pathname === i.to : pathname.startsWith(i.to)
  );
  const pageLabel = title || currentItem?.label || 'Dashboard';

  return (
    <div className="app-shell">

      {/* ── Topbar ── */}
      <header className="topbar">
        <Link to="/backend" className="topbar-logo" style={{ textDecoration: 'none' }}>
          <span className="topbar-logo-icon">☕</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1a0f0a' }}>POS Cafe</span>
        </Link>

        <div className="topbar-divider" />

        <div className="topbar-breadcrumb">
          <span>🏠 Dashboard</span>
          {pageLabel !== 'Dashboard' && (
            <>
              <span className="sep">›</span>
              <span className="current">{pageLabel}</span>
            </>
          )}
        </div>

        <div className="topbar-right">
          {actions && <div style={{ display: 'flex', gap: 6 }}>{actions}</div>}

          <div className="topbar-icon-btn" title="Notifications">
            🔔
            <span className="topbar-badge">2</span>
          </div>

          <div
            className="topbar-user"
            onClick={handleLogout}
            title="Click to logout"
          >
            <div className="topbar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span>{user?.name || 'Admin'}</span>
            <span style={{ opacity: 0.45, fontSize: 10 }}>▾</span>
          </div>
        </div>
      </header>

      {/* ── Sidebar + Main ── */}
      <div style={{ display: 'flex', flex: 1, paddingTop: 58, overflow: 'hidden' }}>

        {/* Sidebar */}
        <nav className="sidebar">

          {/* Store pill */}
          <div className="sidebar-brand-section">
            <div className="sidebar-store-pill">
              <span className="sidebar-store-dot" />
              <span className="sidebar-store-name">☕ Cafe Branch</span>
              <span className="sidebar-store-arrow" style={{ color: '#c8450a' }}>▾</span>
            </div>
          </div>

          {NAV.map((section) => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-label" style={{ color: section.color + 'aa' }}>
                {section.section}
              </div>
              {section.items.map((item) => {
                const isActive    = item.exact
                  ? pathname === item.to
                  : pathname.startsWith(item.to) && item.to !== '/backend';
                const isDashboard = item.to === '/backend' && pathname === '/backend';
                const active      = isActive || isDashboard;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`sidebar-item ${active ? 'active' : ''}`}
                    style={active ? { color: '#e05418', background: 'rgba(200,69,10,0.14)' } : {}}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    {active && (
                      <span style={{
                        position: 'absolute', left: 0, top: '20%', bottom: '20%',
                        width: 3, background: section.color,
                        borderRadius: '0 3px 3px 0',
                      }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="sidebar-divider" style={{ margin: '12px 0' }} />

          <div className="sidebar-section">
            <div className="sidebar-section-label">TERMINALS</div>
            <div
              className="sidebar-item"
              onClick={() => navigate('/backend')}
              style={{ cursor: 'pointer' }}
            >
              <span className="sidebar-icon">🖥️</span>
              <span>POS Terminals</span>
            </div>
          </div>

          <div style={{ flex: 1 }} />
          <div className="sidebar-footer">
            <div className="sidebar-version">POS Cafe v2.0 · © 2026</div>
          </div>
        </nav>

        {/* Main content */}
        <main className="main-content">
          <div className="page-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
