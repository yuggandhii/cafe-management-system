import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import styles from '../Dashboard.module.css';

const STATUS_COLORS = {
  draft: 'badgeDraft',
  paid: 'badgePaid',
  archived: 'badgeDraft',
};

export default function Orders() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', search, status],
    queryFn: () => api.get('/orders', { params: { search, status, limit: 100 } }).then(r => r.data.data),
  });

  const { data: detail } = useQuery({
    queryKey: ['order-detail', selected],
    queryFn: () => api.get(`/orders/${selected}`).then(r => r.data.data),
    enabled: !!selected,
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Orders</div>
          <div className={styles.pageSub}>{orders?.length ?? 0} total orders</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'draft', 'paid'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={styles.actionBtn}
              style={{ background: status === s ? '#facc15' : '#fff', color: '#000', border: '2px solid #000', padding: '6px 14px', fontSize: 10, boxShadow: status === s ? '2px 2px 0 0 #000' : 'none' }}>
              {s === '' ? 'ALL' : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.searchBar}>
        <input className={styles.searchInput} placeholder="Search by order number..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className={styles.box}>
        <div className={styles.boxHeader}>
          <span className={styles.boxTitle}>All Orders</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Order #</th>
                <th className={styles.th}>Date & Time</th>
                <th className={styles.th}>Table</th>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Staff</th>
                <th className={styles.th}>Items</th>
                <th className={styles.th}>Total</th>
                <th className={styles.th}>Payment</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Note</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className={styles.td} colSpan={10} style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : orders?.map(o => (
                <tr key={o.id} className={[styles.tr, styles.trClickable].join(' ')} onClick={() => setSelected(o.id)}>
                  <td className={styles.td}><span className={[styles.badge, styles.badgeBlack].join(' ')}>#{o.order_number}</span></td>
                  <td className={styles.td} style={{ fontSize: 11 }}>
                    <div style={{ fontWeight: 700 }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</div>
                    <div style={{ color: '#64748b' }}>{new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className={styles.td}>{o.table_number ? `Table ${o.table_number}` : '—'}</td>
                  <td className={styles.td}>{o.customer_name || <span style={{ color: '#94a3b8' }}>Walk-in</span>}</td>
                  <td className={styles.td} style={{ fontSize: 12 }}>{o.created_by_name}</td>
                  <td className={styles.td}></td>
                  <td className={styles.td}><strong>₹{parseFloat(o.total).toFixed(0)}</strong></td>
                  <td className={styles.td}></td>
                  <td className={styles.td}><span className={[styles.badge, styles[STATUS_COLORS[o.status]]].join(' ')}>{o.status}</span></td>
                  <td className={styles.td} style={{ fontSize: 11, color: '#64748b', maxWidth: 120 }}>{o.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAIL MODAL */}
      {selected && detail && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Order #{detail.order_number} — {detail.status.toUpperCase()}</span>
              <button className={styles.modalClose} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  ['Table', detail.table_number ? `Table ${detail.table_number}` : 'Takeaway'],
                  ['Customer', detail.customer_name || 'Walk-in'],
                  ['Staff', detail.created_by_name],
                  ['Date', new Date(detail.created_at).toLocaleDateString('en-IN')],
                  ['Time', new Date(detail.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })],
                  ['Status', detail.status.toUpperCase()],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#f8fafc', border: '2px solid #000', padding: '10px 14px' }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>

              {detail.notes && (
                <div style={{ background: '#fef3c7', border: '2px solid #d97706', padding: '10px 14px', marginBottom: 16, fontSize: 12, fontWeight: 600 }}>
                  📝 Note: {detail.notes}
                </div>
              )}

              <table className={styles.table} style={{ marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th className={styles.th}>Product</th>
                    <th className={styles.th}>Note</th>
                    <th className={styles.th}>Qty</th>
                    <th className={styles.th}>Price</th>
                    <th className={styles.th}>Tax</th>
                    <th className={styles.th}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lines?.map(l => (
                    <tr key={l.id} className={styles.tr}>
                      <td className={styles.td} style={{ fontWeight: 700 }}>{l.product_name}</td>
                      <td className={styles.td} style={{ fontSize: 11, color: '#d97706' }}>{l.notes || '—'}</td>
                      <td className={styles.td}>{Math.floor(l.quantity)}</td>
                      <td className={styles.td}>₹{parseFloat(l.unit_price).toFixed(0)}</td>
                      <td className={styles.td}>{l.tax_percent}%</td>
                      <td className={styles.td}><strong>₹{parseFloat(l.total).toFixed(0)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ border: '4px solid #000', padding: '16px 24px', boxShadow: '4px 4px 0 0 #000', minWidth: 240 }}>
                  {[
                    ['Subtotal', `₹${parseFloat(detail.subtotal).toFixed(2)}`],
                    ['Tax', `₹${parseFloat(detail.tax_amount).toFixed(2)}`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      <span style={{ color: '#64748b', textTransform: 'uppercase' }}>{l}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, borderTop: '3px solid #000', paddingTop: 10, marginTop: 6 }}>
                    <span>TOTAL</span>
                    <span>₹{parseFloat(detail.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}