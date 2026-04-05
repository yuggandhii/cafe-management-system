import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import usePosStore from '../../store/posStore';
import socket from '../../socket';
import api from '../../api/axios';

export default function FloorView() {
  const { config_id } = useParams();
  const navigate = useNavigate();
  const { setSession, setConfig } = usePosStore();

  const { data: config } = useQuery({
    queryKey: ['pos-config', config_id],
    queryFn: () => api.get(`/pos-configs/${config_id}`).then((r) => r.data.data),
  });

  const { data: session } = useQuery({
    queryKey: ['active-session', config_id],
    queryFn: () => api.get(`/sessions/config/${config_id}/active`).then((r) => r.data.data),
  });

  const { data: floors } = useQuery({
    queryKey: ['floors'],
    queryFn: () => api.get('/floors').then((r) => r.data.data),
  });

  const { data: allTables } = useQuery({
    queryKey: ['all-tables'],
    queryFn: () => api.get('/floors/tables/all').then((r) => r.data.data),
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['orders', session?.id],
    queryFn: () => api.get('/orders', { params: { session_id: session?.id } }).then((r) => r.data.data),
    enabled: !!session?.id,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (config) setConfig(config);
    if (session) {
      setSession(session);
      socket.connect();
      socket.emit('join:session', session.id);
    }
    return () => { socket.disconnect(); };
  }, [config, session]);

  const getTableStatus = (tableId) => {
    const order = activeOrders?.find((o) => o.table_id === tableId && o.status !== 'paid' && o.status !== 'cancelled');
    if (!order) return 'free';
    if (order.status === 'draft' || order.status === 'sent_to_kitchen') return 'occupied';
    return 'occupied';
  };

  const handleTableClick = async (table) => {
    if (!session) {
      // Try to open session
      try {
        const res = await api.post('/sessions/open', { pos_config_id: config_id });
        setSession(res.data.data);
      } catch (e) {
        return;
      }
    }
    navigate(`/pos/${config_id}/order/${table.id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* POS Header */}
      <div style={{
        height: 56,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>☕ {config?.name}</span>
          <span className={`badge ${session ? 'badge-success' : 'badge-warning'}`}>
            {session ? 'Session Open' : 'No Session'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {session && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/kitchen/${session.id}`)}
            >
              🍳 Kitchen
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/backend')}>
            ⚙️ Backend
          </button>
        </div>
      </div>

      {/* Floor tabs */}
      {floors && floors.length > 1 && (
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex' }}>
          {floors.map((f) => (
            <button key={f.id} className="tab active" style={{ cursor: 'default' }}>{f.name}</button>
          ))}
        </div>
      )}

      {/* Table grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {!allTables?.length ? (
          <div className="empty-state">
            <div className="empty-state-icon">🪑</div>
            <div className="empty-state-title">No tables configured</div>
            <p className="empty-state-subtitle">Go to Backend → Floors & Tables to add tables</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/backend/floors')}>
              Setup Tables
            </button>
          </div>
        ) : (
          <div className="table-grid">
            {allTables.map((table) => {
              const status = getTableStatus(table.id);
              return (
                <div
                  key={table.id}
                  className={`table-card${status === 'occupied' ? ' occupied' : ''}`}
                  onClick={() => handleTableClick(table)}
                >
                  <div className="table-number">{table.table_number}</div>
                  <div className="table-seats">👥 {table.seats} seats</div>
                  {table.floor_name && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{table.floor_name}</div>}
                  <div className="table-status-label" style={{
                    color: status === 'occupied' ? 'var(--warning)' : 'var(--text-3)',
                    marginTop: 4
                  }}>
                    {status === 'occupied' ? '🔴 Occupied' : '⬜ Free'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
