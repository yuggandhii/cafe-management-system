import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import socket from '../../socket';
import api from '../../api/axios';

export default function CustomerDisplay() {
  const { order_id } = useParams();
  const qc = useQueryClient();

  const { data: order } = useQuery({
    queryKey: ['order-display', order_id],
    queryFn: () =>
      order_id
        ? api.get(`/orders/${order_id}`).then((r) => r.data.data)
        : Promise.resolve(null),
    enabled: !!order_id,
    refetchInterval: 5000,
  });

  useEffect(() => {
    socket.connect();

    socket.on('payment:confirmed', () => {
      qc.invalidateQueries(['order-display']);
    });

    socket.on('order:status_changed', () => {
      qc.invalidateQueries(['order-display']);
    });

    return () => {
      socket.off('payment:confirmed');
      socket.off('order:status_changed');
      socket.disconnect();
    };
  }, [qc]);

  const isPaid = order?.status === 'paid';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: order ? 'flex-start' : 'center',
      }}
    >
      {/* Header */}
      <div
        style={{
          width: '100%',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--primary)' }}>
          ☕ POS Cafe
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Customer Display</div>
      </div>

      {!order ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            padding: 60,
          }}
        >
          <div style={{ fontSize: 64 }}>👋</div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Welcome!</h2>
          <p style={{ color: 'var(--text-3)' }}>Your order will appear here.</p>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 560, padding: 24 }}>
          {/* Status banner */}
          {isPaid ? (
            <div
              style={{
                background: 'var(--success-bg)',
                color: 'var(--success)',
                padding: '16px 20px',
                fontWeight: 700,
                fontSize: 18,
                textAlign: 'center',
                marginBottom: 20,
                border: '1px solid var(--success)',
              }}
            >
              ✅ Payment Confirmed — Thank You!
            </div>
          ) : (
            <div
              style={{
                background: 'var(--info-bg)',
                color: 'var(--info)',
                padding: '12px 20px',
                fontWeight: 600,
                fontSize: 14,
                textAlign: 'center',
                marginBottom: 20,
                border: '1px solid var(--info)',
              }}
            >
              📋 Order #{order.order_number} — {order.status === 'sent_to_kitchen' ? '🍳 Being Prepared' : 'Pending Payment'}
            </div>
          )}

          {/* Order lines */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Your Order
            </div>

            {order.lines?.map((line) => (
              <div
                key={line.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 14,
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{line.product_name}</span>
                  {line.variant_value && (
                    <span style={{ color: 'var(--text-3)', marginLeft: 6, fontSize: 12 }}>
                      ({line.variant_value})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-3)' }}>× {line.quantity}</span>
                  <span style={{ fontWeight: 600, minWidth: 70, textAlign: 'right' }}>
                    ₹{parseFloat(line.total).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Totals */}
            <div style={{ padding: '12px 16px', borderTop: '2px solid var(--border-2)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: 'var(--text-2)',
                  marginBottom: 4,
                }}
              >
                <span>Subtotal</span>
                <span>₹{parseFloat(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: 'var(--text-2)',
                  marginBottom: 10,
                }}
              >
                <span>Tax</span>
                <span>₹{parseFloat(order.tax_amount || 0).toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: 20,
                  borderTop: '1px solid var(--border)',
                  paddingTop: 10,
                }}
              >
                <span>TOTAL</span>
                <span style={{ color: 'var(--primary)' }}>
                  ₹{parseFloat(order.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {isPaid && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 48 }}>🙏</div>
              <p style={{ marginTop: 12, fontSize: 16, fontWeight: 500 }}>
                Thank you for dining with us!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
