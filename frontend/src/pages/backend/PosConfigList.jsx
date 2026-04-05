import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import Badge from '../../components/Badge';
import { useToast } from '../../components/Toast';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

/* ── colourful gradient stat card variants ── */
const STAT_STYLES = [
  { numClass: 'blue',   iconClass: 'blue',   grad: 'linear-gradient(135deg,#818cf8,#6366f1)' },
  { numClass: 'green',  iconClass: 'green',  grad: 'linear-gradient(135deg,#34d399,#10b981)' },
  { numClass: 'orange', iconClass: 'orange', grad: 'linear-gradient(135deg,#fbbf24,#f59e0b)' },
  { numClass: 'teal',   iconClass: 'teal',   grad: 'linear-gradient(135deg,#2dd4bf,#14b8a6)' },
];

/* ── Quick-action colour data ── */
const QUICK = [
  { to: '/backend/orders',    icon: '📋', label: 'View All Orders',   sub: 'Track & manage orders',    accent: '#6366f1', bg: '#ede9fe' },
  { to: '/backend/reports',   icon: '📊', label: 'Sales Reports',     sub: 'Revenue & analytics',      accent: '#0ea5e9', bg: '#e0f2fe' },
  { to: '/backend/products',  icon: '🍽️', label: 'Manage Products',   sub: 'Menu & categories',        accent: '#10b981', bg: '#d1fae5' },
  { to: '/backend/floors',    icon: '🪑', label: 'Floors & Tables',   sub: 'Layout management',        accent: '#f59e0b', bg: '#fef3c7' },
];

function TerminalCard({ config }) {
  const navigate = useNavigate();
  const toast    = useToast();
  const qc       = useQueryClient();

  const { data: activeSession, refetch } = useQuery({
    queryKey: ['active-session', config.id],
    queryFn: () => api.get(`/sessions/config/${config.id}/active`).then((r) => r.data.data),
    staleTime: 15000,
  });

  const openSession = useMutation({
    mutationFn: () => api.post('/sessions/open', { pos_config_id: config.id }),
    onSuccess: () => { toast.success('Session opened! 🚀'); refetch(); navigate(`/pos/${config.id}`); },
    onError: (err) => {
      if (err.response?.status === 409) { refetch(); navigate(`/pos/${config.id}`); }
      else toast.error(err.response?.data?.message || 'Failed to open session');
    },
  });

  const closeSession = useMutation({
    mutationFn: () => api.post(`/sessions/${activeSession.id}/close`),
    onSuccess: () => { toast.success('Session closed'); refetch(); qc.invalidateQueries(['pos-configs']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const hasActive = !!activeSession;

  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${hasActive ? '#bbf7d0' : '#e5e7eb'}`,
      borderRadius: 14,
      padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: hasActive
        ? '0 2px 16px rgba(16,185,129,0.12)'
        : '0 1px 4px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease',
    }}>
      {/* Icon */}
      <div style={{
        width: 50, height: 50, borderRadius: 12, flexShrink: 0,
        background: hasActive
          ? 'linear-gradient(135deg,#34d399,#10b981)'
          : 'linear-gradient(135deg,#e5e7eb,#d1d5db)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
        boxShadow: hasActive ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
      }}>
        🖥️
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <strong style={{ fontSize: 14, color: '#111827' }}>{config.name}</strong>
          {hasActive && (
            <span style={{
              fontSize: 10, fontWeight: 800,
              background: '#d1fae5', color: '#065f46',
              padding: '2px 9px', borderRadius: 20, letterSpacing: '0.05em',
            }}>
              ● LIVE
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {config.enable_cash    && <Badge status="cash"    label="Cash" />}
          {config.enable_digital && <Badge status="digital" label="Digital" />}
          {config.enable_upi     && <Badge status="upi"     label="UPI" />}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <Link to={`/backend/pos-config/${config.id}`} className="btn btn-secondary btn-sm">
          ⚙ Settings
        </Link>
        {hasActive ? (
          <>
            <button className="btn btn-success btn-sm" onClick={() => navigate(`/pos/${config.id}`)}>
              ▶ Enter POS
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => closeSession.mutate()}
              disabled={closeSession.isPending}
            >
              ✕ Close
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => openSession.mutate()}
            disabled={openSession.isPending}
          >
            {openSession.isPending ? '…' : '▶ Open Session'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PosConfigList() {
  const toast  = useToast();
  const qc     = useQueryClient();
  const { user } = useAuthStore();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['pos-configs'],
    queryFn: () => api.get('/pos-configs').then((r) => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/reports/summary').then((r) => r.data.data),
    staleTime: 60000,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => api.get('/orders?limit=5').then((r) => r.data.data),
    staleTime: 30000,
  });

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening';
  const dateStr  = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const STATS = [
    { num: stats?.total_orders ?? '—',  label: 'Total Orders Today', icon: '🛒', trend: '↑ +3 vs yesterday',   trendUp: true,  ...STAT_STYLES[0] },
    { num: `₹${stats?.total_revenue ? parseFloat(stats.total_revenue).toFixed(0) : '0'}`, label: "Today's Revenue", icon: '💰', trend: '↑ +12% vs yesterday', trendUp: true, ...STAT_STYLES[1] },
    { num: stats?.pending_orders ?? '0', label: 'Pending Orders',   icon: '⏳', trend: 'Needs attention',     trendUp: false, ...STAT_STYLES[2] },
    { num: configs?.length ?? '—',      label: 'POS Terminals',     icon: '🖥️', trend: 'Active this session',  trendUp: null,  ...STAT_STYLES[3] },
  ];

  return (
    <AdminLayout title="Dashboard">

      {/* ── Welcome Banner ── */}
      <div className="welcome-banner">
        <div>
          <div className="welcome-title">{greeting}, {user?.name || 'Admin'}!</div>
          <div className="welcome-sub">{dateStr} · Here's what's happening at your cafe today.</div>
        </div>
        <Link
          to="/backend/orders"
          className="btn btn-sm"
          style={{
            flexShrink: 0, background: 'rgba(255,255,255,0.22)',
            border: '1px solid rgba(255,255,255,0.35)', color: '#fff', fontWeight: 700,
          }}
        >
          View All Orders →
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stat-cards">
        {STATS.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-card-body">
              <div className={`stat-card-num ${s.numClass}`}>{s.num}</div>
              <div className="stat-card-label">{s.label}</div>
              <div
                className={`stat-card-trend ${s.trendUp === null ? 'neutral' : ''}`}
                style={s.trendUp === false ? { color: '#f59e0b' } : {}}
              >
                {s.trend}
              </div>
            </div>
            <div className={`stat-card-icon ${s.iconClass}`} style={{ background: s.grad }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="quick-actions mb-4">
        {QUICK.map((q) => (
          <Link key={q.to} to={q.to} className="quick-action">
            <div
              className="quick-action-icon"
              style={{ background: q.bg, fontSize: 22 }}
            >
              {q.icon}
            </div>
            <div>
              <div className="quick-action-label" style={{ color: q.accent }}>{q.label}</div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{q.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── POS Terminals ── */}
      <div className="card mb-4">
        <div className="card-header">
          <div>
            <span className="card-title">🖥️ POS Terminals</span>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {configs?.length ?? 0} terminal{configs?.length !== 1 ? 's' : ''} configured
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() =>
              api.post('/pos-configs', { name: 'New Terminal', enable_cash: true })
                .then(() => { qc.invalidateQueries(['pos-configs']); toast.success('Terminal created! 🖥️'); })
                .catch(() => toast.error('Failed'))
            }
          >
            + Add Terminal
          </button>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isLoading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : !configs?.length ? (
            <div className="empty-state">
              <div className="empty-state-icon">🖥️</div>
              <div className="empty-state-title">No Terminals Yet</div>
              <p className="empty-state-subtitle">Create your first POS terminal to start taking orders</p>
            </div>
          ) : (
            configs.map((config) => (
              <TerminalCard key={config.id} config={config} />
            ))
          )}
        </div>
      </div>

      {/* ── Recent Orders ── */}
      {recentOrders?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <span className="card-title">📋 Recent Orders</span>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Last 5 orders across all terminals</div>
            </div>
            <Link to="/backend/orders" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Table</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/backend/orders/${o.id}`} style={{ fontWeight: 700 }}>
                        {o.order_number}
                      </Link>
                    </td>
                    <td style={{ color: '#6b7280', fontWeight: 500 }}>
                      {o.table_number ? `Table ${o.table_number}` : '—'}
                    </td>
                    <td><Badge status={o.status} label={o.status} /></td>
                    <td style={{ color: '#10b981', fontWeight: 800 }}>
                      ₹{parseFloat(o.total || 0).toFixed(2)}
                    </td>
                    <td style={{ color: '#9ca3af', fontSize: '11.5px' }}>
                      {new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
