import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/AdminLayout';
import Badge from '../../components/Badge';
import api from '../../api/axios';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('products');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data.data),
  });

  if (isLoading) return <AdminLayout title="Order Detail"><div className="loading-center"><div className="spinner" /></div></AdminLayout>;
  if (!order) return <AdminLayout title="Order"><div className="empty-state"><p>Order not found</p></div></AdminLayout>;

  return (
    <AdminLayout
      title={`Order ${order.order_number}`}
      actions={
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
      }
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div className="tabs">
            {['products', 'extra_info'].map((t) => (
              <button key={t} type="button" className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                {t === 'products' ? 'Products' : 'Extra Info'}
              </button>
            ))}
          </div>

          {tab === 'products' && (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines?.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_name}</td>
                      <td>{line.variant_value || '—'}</td>
                      <td>{line.quantity}</td>
                      <td>₹{parseFloat(line.unit_price).toFixed(2)}</td>
                      <td>₹{parseFloat(line.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'extra_info' && (
            <div className="card">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><span className="form-label">Customer: </span>{order.customer_name || 'Walk-in'}</div>
                <div><span className="form-label">Table: </span>{order.table_number || 'N/A'}</div>
                <div><span className="form-label">Session ID: </span>{order.session_id}</div>
                <div><span className="form-label">Note: </span>{order.note || '—'}</div>
                {order.payments?.map((p) => (
                  <div key={p.id}><span className="form-label">Payment: </span><Badge status={p.method} /> ₹{parseFloat(p.amount).toFixed(2)}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 220, flexShrink: 0 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Summary</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Status</span><Badge status={order.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Subtotal</span><span>₹{parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Tax</span><span>₹{parseFloat(order.tax_amount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <span>Total</span><span>₹{parseFloat(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
