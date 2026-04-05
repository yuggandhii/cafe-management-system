import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/AdminLayout';
import Badge from '../../components/Badge';
import api from '../../api/axios';

export default function PaymentsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then((r) => r.data.data),
  });

  const grouped = (data || []).reduce((acc, p) => {
    if (!acc[p.method]) acc[p.method] = [];
    acc[p.method].push(p);
    return acc;
  }, {});

  const methodTotal = (method) =>
    (grouped[method] || []).reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2);

  return (
    <AdminLayout title="Payments">
      {isLoading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {['cash', 'digital', 'upi'].map((method) => (
            <div key={method} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Badge status={method} />
                  <span className="card-title" style={{ textTransform: 'capitalize' }}>{method}</span>
                </div>
                <strong>Total: ₹{methodTotal(method)}</strong>
              </div>
              {(grouped[method] || []).length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>No {method} payments</div>
              ) : (
                <table className="data-table">
                  <thead><tr>
                    <th>Order #</th>
                    <th>Table</th>
                    <th>Amount</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr></thead>
                  <tbody>
                    {grouped[method].map((p) => (
                      <tr key={p.id}>
                        <td>{p.order_number}</td>
                        <td>{p.table_number || '—'}</td>
                        <td>₹{parseFloat(p.amount).toFixed(2)}</td>
                        <td>{new Date(p.created_at).toLocaleString('en-IN')}</td>
                        <td><Badge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
