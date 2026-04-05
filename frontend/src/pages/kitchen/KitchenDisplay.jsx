import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import socket from '../../socket';
import api from '../../api/axios';

const STATUS_LABELS = { to_cook: '🔴 To Cook', preparing: '🟡 Preparing', completed: '✅ Done' };
const STATUS_ORDER = ['to_cook', 'preparing', 'completed'];

export default function KitchenDisplay() {
  const { session_id } = useParams();
  const qc = useQueryClient();
  const [updating, setUpdating] = useState(null);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['kitchen-tickets', session_id],
    queryFn: () => api.get(`/kitchen/session/${session_id}`).then((r) => r.data.data),
    refetchInterval: 15000,
  });

  useEffect(() => {
    socket.connect();
    socket.emit('join:kitchen', session_id);

    socket.on('kitchen:new_ticket', () => {
      qc.invalidateQueries(['kitchen-tickets', session_id]);
    });

    socket.on('kitchen:ticket_updated', () => {
      qc.invalidateQueries(['kitchen-tickets', session_id]);
    });

    socket.on('kitchen:item_toggled', () => {
      qc.invalidateQueries(['kitchen-tickets', session_id]);
    });

    return () => {
      socket.off('kitchen:new_ticket');
      socket.off('kitchen:ticket_updated');
      socket.off('kitchen:item_toggled');
      socket.disconnect();
    };
  }, [session_id]);

  const advance = async (ticket) => {
    const idx = STATUS_ORDER.indexOf(ticket.status);
    const next = STATUS_ORDER[idx + 1];
    if (!next) return;
    setUpdating(ticket.id);
    try {
      await api.patch(`/kitchen/${ticket.id}/status`, { status: next });
      qc.invalidateQueries(['kitchen-tickets', session_id]);
    } finally {
      setUpdating(null);
    }
  };

  const toggleItem = async (itemId, current) => {
    await api.patch(`/kitchen/items/${itemId}/toggle`, { is_prepared: !current });
    qc.invalidateQueries(['kitchen-tickets', session_id]);
  };

  const activeTickets = tickets?.filter((t) => t.status !== 'completed') || [];
  const done = tickets?.filter((t) => t.status === 'completed') || [];

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', color: '#e0e0e0' }}>
      {/* KDS Header */}
      <div style={{ background: '#0f3460', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>🍳 Kitchen Display</div>
        <div style={{ fontSize: 12, color: '#a0a8b8' }}>Session: {session_id?.slice(0, 8)}... • Live</div>
      </div>

      {isLoading ? (
        <div className="loading-center" style={{ color: '#a0a8b8' }}><div className="spinner" style={{ borderColor: '#444', borderTopColor: '#60a5fa' }} /></div>
      ) : (
        <div style={{ padding: 20 }}>
          {activeTickets.length === 0 && (
            <div style={{ textAlign: 'center', padding: 80, color: '#555' }}>
              <div style={{ fontSize: 60 }}>😴</div>
              <div style={{ fontSize: 20, marginTop: 16 }}>No pending orders</div>
            </div>
          )}

          <div className="kds-grid">
            {activeTickets.map((ticket) => (
              <div key={ticket.id} style={{ background: '#16213e', border: '1px solid #0f3460', borderRadius: 4 }}>
                <div className={`ticket-header ${ticket.status}`}
                  style={{
                    background: ticket.status === 'to_cook' ? '#4a3000' : ticket.status === 'preparing' ? '#002060' : '#003020',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{ticket.order_number}</div>
                    <div style={{ fontSize: 12, color: '#a0a8b8' }}>Table {ticket.table_number || 'N/A'}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#e0e0e0' }}>
                    {STATUS_LABELS[ticket.status]}
                  </div>
                </div>

                <div>
                  {(ticket.items || []).map((item) => (
                    <div
                      key={item.id}
                      className={`ticket-item${item.is_prepared ? ' done' : ''}`}
                      style={{ cursor: 'pointer', color: item.is_prepared ? '#555' : '#e0e0e0' }}
                      onClick={() => toggleItem(item.id, item.is_prepared)}
                    >
                      <span style={{ fontSize: 16 }}>{item.is_prepared ? '☑' : '☐'}</span>
                      <span style={{ flex: 1 }}>{item.product_name}</span>
                      <span style={{ fontWeight: 700 }}>×{item.qty}</span>
                    </div>
                  ))}
                </div>

                {ticket.status !== 'completed' && (
                  <div style={{ padding: 10, borderTop: '1px solid #0f3460' }}>
                    <button
                      onClick={() => advance(ticket)}
                      disabled={updating === ticket.id}
                      style={{
                        width: '100%',
                        background: ticket.status === 'to_cook' ? '#2563eb' : '#059669',
                        color: '#fff',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {ticket.status === 'to_cook' ? '→ Start Preparing' : '→ Mark Complete'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {done.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ color: '#555', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Completed ({done.length})</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {done.map((t) => (
                  <div key={t.id} style={{ background: '#0a2020', border: '1px solid #1a4030', padding: '6px 12px', borderRadius: 2, fontSize: 12, color: '#555' }}>
                    {t.order_number}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
