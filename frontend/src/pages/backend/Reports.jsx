import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api/axios';

const PIE_COLORS = { cash: '#27AE60', digital: '#2980B9', upi: '#E67E22' };

export default function Reports() {
  const { data: report, isLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => api.get('/reports/summary').then((r) => r.data.data),
  });

  if (isLoading) return <AdminLayout title="Reports"><div className="loading-center"><div className="spinner" /></div></AdminLayout>;

  const kpis = [
    { label: 'Total Orders', value: report?.total_orders },
    { label: 'Total Revenue', value: `₹${(report?.total_revenue || 0).toFixed(2)}` },
    { label: 'Total Tax', value: `₹${(report?.total_tax || 0).toFixed(2)}` },
    { label: 'Avg Order Value', value: `₹${(report?.avg_order || 0).toFixed(2)}` },
  ];

  const hourlyData = (report?.sales_by_hour || []).map((r) => ({
    hour: `${String(parseInt(r.hour)).padStart(2, '0')}:00`,
    revenue: parseFloat(r.revenue),
    count: parseInt(r.count),
  }));

  const paymentData = (report?.payment_breakdown || []).map((p) => ({
    name: p.method,
    value: parseFloat(p.total),
  }));

  return (
    <AdminLayout title="Reports & Analytics">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* KPIs */}
        <div className="kpi-grid">
          {kpis.map((k) => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.value ?? '—'}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Revenue by Hour</span></div>
            <div className="card-body">
              {hourlyData.length === 0 ? (
                <div className="empty-state">No hourly data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="var(--primary)" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Payment Methods</span></div>
            <div className="card-body">
              {paymentData.length === 0 ? (
                <div className="empty-state">No payment data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {paymentData.map((entry) => (
                        <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#ccc'} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header"><span className="card-title">Top 10 Products</span></div>
          {(report?.top_products || []).length === 0 ? (
            <div className="empty-state">No sales data</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {report.top_products.map((p, i) => (
                  <tr key={p.name}>
                    <td style={{ color: 'var(--text-3)' }}>{i + 1}</td>
                    <td>{p.name}</td>
                    <td>{p.qty}</td>
                    <td>₹{parseFloat(p.revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
