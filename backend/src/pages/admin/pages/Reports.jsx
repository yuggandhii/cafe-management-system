import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import styles from '../Dashboard.module.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

const PERIODS = ['today', 'weekly', 'monthly', 'yearly'];
const PIE_COLORS = ['#facc15', '#000000', '#64748b', '#e2e8f0', '#16a34a', '#2563eb'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];

export default function Reports() {
  const [period, setPeriod] = useState('weekly');

  const { data: dash } = useQuery({ queryKey: ['dashboard', period], queryFn: () => api.get(`/reports/dashboard?period=${period}`).then(r => r.data.data) });
  const { data: chart } = useQuery({ queryKey: ['sales-chart', period], queryFn: () => api.get(`/reports/sales-chart?period=${period}`).then(r => r.data.data) });
  const { data: topProducts } = useQuery({ queryKey: ['top-products', period], queryFn: () => api.get(`/reports/top-products?period=${period}`).then(r => r.data.data) });
  const { data: topCategories } = useQuery({ queryKey: ['top-categories', period], queryFn: () => api.get(`/reports/top-categories?period=${period}`).then(r => r.data.data) });
  const { data: topOrders } = useQuery({ queryKey: ['top-orders', period], queryFn: () => api.get(`/reports/top-orders?period=${period}`).then(r => r.data.data) });
  const { data: payments } = useQuery({ queryKey: ['payments'], queryFn: () => api.get('/payments').then(r => r.data.data) });
  const { data: heatmap } = useQuery({ queryKey: ['heatmap'], queryFn: () => api.get('/reports/hourly-heatmap').then(r => r.data.data) });
  const { data: retention } = useQuery({ queryKey: ['retention'], queryFn: () => api.get('/reports/customer-retention').then(r => r.data.data) });
  const { data: staffPerf } = useQuery({ queryKey: ['staff-perf'], queryFn: () => api.get('/reports/staff-performance').then(r => r.data.data) });
  const { data: tableRev } = useQuery({ queryKey: ['table-rev'], queryFn: () => api.get('/reports/table-revenue').then(r => r.data.data) });

  // Build heatmap grid
  const getHeat = (day, hour) => {
    if (!heatmap) return 0;
    const cell = heatmap.find(h => h.day === day && h.hour === hour);
    return cell?.count || 0;
  };
  const maxHeat = heatmap ? Math.max(...heatmap.map(h => h.count), 1) : 1;

  const getHeatColor = (count) => {
    if (count === 0) return '#f1f5f9';
    const intensity = count / maxHeat;
    if (intensity > 0.7) return '#000000';
    if (intensity > 0.4) return '#facc15';
    return '#fef3c7';
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Reports</div>
          <div className={styles.pageSub}>Sales analytics and insights</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={styles.actionBtn}
              style={{ background: period === p ? '#facc15' : '#fff', color: '#000', border: '2px solid #000', padding: '6px 14px', fontSize: 10, boxShadow: period === p ? '2px 2px 0 0 #000' : 'none' }}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Orders', value: dash?.total_orders ?? '—', color: '#facc15' },
          { label: 'Total Revenue', value: `₹${dash?.revenue ?? '—'}`, color: '#16a34a' },
          { label: 'Avg Order Value', value: `₹${dash?.avg_order ?? '—'}`, color: '#2563eb' },
        ].map(k => (
          <div key={k.label} className={styles.kpiCard} style={{ borderLeft: `6px solid ${k.color}` }}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiValue}>{k.value}</div>
            <div className={styles.kpiSub}>{period} period • {dash?.revenue_change > 0 ? '+' : ''}{dash?.revenue_change ?? 0}% vs prev</div>
          </div>
        ))}
      </div>

      {/* PAYMENT BREAKDOWN */}
      <div className={styles.box} style={{ marginBottom: 20 }}>
        <div className={styles.boxHeader}><span className={styles.boxTitle}>Payment Method Breakdown</span></div>
        <div className={styles.boxBody}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { method: 'cash', label: 'Cash', color: '#16a34a' },
              { method: 'digital', label: 'Digital / Card', color: '#2563eb' },
              { method: 'upi', label: 'UPI', color: '#d97706' },
            ].map(({ method, label, color }) => (
              <div key={method} style={{ border: '4px solid #000', padding: '20px', boxShadow: '4px 4px 0 0 #000', borderLeft: `6px solid ${color}` }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>₹{parseFloat(payments?.summary?.[method]?.total || 0).toFixed(0)}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 4 }}>{payments?.summary?.[method]?.count || 0} transactions</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REVENUE CHART + CATEGORY PIE */}
      <div className={styles.grid2} style={{ marginBottom: 20 }}>
        <div className={styles.box}>
          <div className={styles.boxHeader}><span className={styles.boxTitle}>Revenue Over Time</span></div>
          <div className={styles.boxBody}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chart || []}>
                <XAxis dataKey="time" tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip contentStyle={{ border: '3px solid #000', borderRadius: 0, fontWeight: 700, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#facc15" stroke="#000" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.box}>
          <div className={styles.boxHeader}><span className={styles.boxTitle}>Category Revenue Share</span></div>
          <div className={styles.boxBody}>
            {topCategories?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={topCategories} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={70} stroke="#000" strokeWidth={2}>
                      {topCategories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend formatter={v => <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{v}</span>} />
                    <Tooltip contentStyle={{ border: '3px solid #000', borderRadius: 0, fontWeight: 700, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <table className={styles.table} style={{ marginTop: 8 }}>
                  <thead><tr>
                    <th className={styles.th}>Category</th>
                    <th className={styles.th}>Revenue</th>
                    <th className={styles.th}>Share</th>
                  </tr></thead>
                  <tbody>
                    {topCategories.map((c, i) => (
                      <tr key={i} className={styles.tr}>
                        <td className={styles.td}><span style={{ display: 'inline-block', width: 10, height: 10, background: PIE_COLORS[i], border: '2px solid #000', marginRight: 8 }} /><strong>{c.category}</strong></td>
                        <td className={styles.td}>₹{parseFloat(c.revenue).toFixed(0)}</td>
                        <td className={styles.td}><span className={[styles.badge, styles.badgeAmber].join(' ')}>{c.percent}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : <div className={styles.empty}><div className={styles.emptyTitle}>No data</div></div>}
          </div>
        </div>
      </div>

      {/* HOURLY HEATMAP */}
      <div className={styles.box} style={{ marginBottom: 20 }}>
        <div className={styles.boxHeader}>
          <span className={styles.boxTitle}>Peak Hours Heatmap</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Order volume by day and hour
          </span>
        </div>
        <div className={styles.boxBody}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            {[
              { color: '#f1f5f9', label: '0 orders' },
              { color: '#fef3c7', label: 'Low' },
              { color: '#facc15', label: 'Medium' },
              { color: '#000000', label: 'Peak' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 14, height: 14, background: color, border: '2px solid #000' }} />
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 40, fontSize: 9, fontWeight: 900, color: '#64748b', textAlign: 'left', paddingRight: 8, textTransform: 'uppercase' }}>Day</th>
                  {HOURS.map(h => (
                    <th key={h} style={{ fontSize: 9, fontWeight: 900, color: '#64748b', textAlign: 'center', padding: '0 2px', textTransform: 'uppercase' }}>
                      {h > 12 ? `${h - 12}P` : `${h}A`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, d) => (
                  <tr key={day}>
                    <td style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', paddingRight: 8, paddingTop: 4 }}>{day}</td>
                    {HOURS.map(h => {
                      const count = getHeat(d, h);
                      const color = getHeatColor(count);
                      return (
                        <td key={h} style={{ padding: 2 }}>
                          <div
                            title={`${day} ${h}:00 — ${count} orders`}
                            style={{
                              width: 28, height: 28,
                              background: color,
                              border: '2px solid #000',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, fontWeight: 900,
                              color: color === '#000000' ? '#facc15' : '#000',
                              cursor: 'default',
                              transition: 'transform 150ms',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            {count > 0 ? count : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CUSTOMER RETENTION */}
      <div className={styles.grid2} style={{ marginBottom: 20 }}>
        <div className={styles.box}>
          <div className={styles.boxHeader}><span className={styles.boxTitle}>Customer Retention</span></div>
          <div className={styles.boxBody}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={retention ? [
                        { name: 'Loyal (5+ visits)', value: retention.returning.count },
                        { name: 'Occasional (2-4)', value: retention.occasional.count },
                        { name: 'New (1 visit)', value: retention.new.count },
                      ] : []}
                      dataKey="value"
                      cx="50%" cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      stroke="#000" strokeWidth={2}
                    >
                      <Cell fill="#000000" />
                      <Cell fill="#facc15" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                    <Tooltip contentStyle={{ border: '3px solid #000', borderRadius: 0, fontWeight: 700, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>{retention?.total}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total</div>
                </div>
              </div>
            </div>

            {retention && [
              { label: 'Loyal Regulars', sub: '5+ visits', count: retention.returning.count, pct: retention.returning.percent, color: '#000' },
              { label: 'Occasional', sub: '2-4 visits', count: retention.occasional.count, pct: retention.occasional.percent, color: '#facc15' },
              { label: 'New Customers', sub: '1 visit', count: retention.new.count, pct: retention.new.percent, color: '#e2e8f0' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 14, height: 14, background: r.color, border: '2px solid #000', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{r.sub}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{r.count}</div>
                  <span className={[styles.badge, r.pct >= 20 ? styles.badgeAmber : styles.badgeBlue].join(' ')}>{r.pct}%</span>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16, padding: '12px 14px', background: parseFloat(retention?.returning?.percent) >= 15 && parseFloat(retention?.returning?.percent) <= 25 ? '#dcfce7' : '#fef3c7', border: '3px solid #000' }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {parseFloat(retention?.returning?.percent) >= 15 && parseFloat(retention?.returning?.percent) <= 25
                  ? '✓ Healthy retention rate (15-25% target)'
                  : `⚠ Retention: ${retention?.returning?.percent}% — Target is 15-25%`}
              </div>
            </div>
          </div>
        </div>

        {/* STAFF PERFORMANCE */}
        <div className={styles.box}>
          <div className={styles.boxHeader}><span className={styles.boxTitle}>Staff Performance</span></div>
          <div className={styles.boxBody}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={staffPerf?.map(s => ({ name: s.name.split(' ')[0], revenue: parseFloat(s.revenue), orders: parseInt(s.orders) })) || []} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 900 }} width={60} />
                <Tooltip contentStyle={{ border: '3px solid #000', borderRadius: 0, fontWeight: 700, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#facc15" stroke="#000" strokeWidth={2} name="Revenue ₹" />
              </BarChart>
            </ResponsiveContainer>

            <table className={styles.table} style={{ marginTop: 12 }}>
              <thead><tr>
                <th className={styles.th}>Staff</th>
                <th className={styles.th}>Sessions</th>
                <th className={styles.th}>Hours</th>
                <th className={styles.th}>Orders</th>
                <th className={styles.th}>Revenue</th>
              </tr></thead>
              <tbody>
                {staffPerf?.map((s, i) => (
                  <tr key={i} className={styles.tr}>
                    <td className={styles.td}><strong>{s.name}</strong><div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>{s.role}</div></td>
                    <td className={styles.td}>{parseInt(s.sessions)}</td>
                    <td className={styles.td}>{parseFloat(s.hours).toFixed(1)}h</td>
                    <td className={styles.td}>{parseInt(s.orders)}</td>
                    <td className={styles.td}><strong>₹{parseFloat(s.revenue).toFixed(0)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TABLE REVENUE + TOP PRODUCTS/ORDERS */}
      <div className={styles.grid2} style={{ marginBottom: 20 }}>
        <div className={styles.box}>
          <div className={styles.boxHeader}><span className={styles.boxTitle}>Revenue by Table</span></div>
          <div className={styles.boxBody}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tableRev?.map(t => ({ table: `${t.table_number}`, revenue: parseFloat(t.revenue), orders: parseInt(t.order_count) })) || []}>
                <XAxis dataKey="table" tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip contentStyle={{ border: '3px solid #000', borderRadius: 0, fontWeight: 700, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#000" stroke="#000" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.box}>
          <div className={styles.boxHeader}><span className={styles.boxTitle}>Top Products</span></div>
          <table className={styles.table}>
            <thead><tr>
              <th className={styles.th}>#</th>
              <th className={styles.th}>Product</th>
              <th className={styles.th}>Qty</th>
              <th className={styles.th}>Revenue</th>
            </tr></thead>
            <tbody>
              {topProducts?.map((p, i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 900 }}>{i + 1}</td>
                  <td className={styles.td}><strong>{p.product}</strong></td>
                  <td className={styles.td}>{Math.floor(p.qty)}</td>
                  <td className={styles.td}><strong>₹{parseFloat(p.revenue).toFixed(0)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOP ORDERS */}
      <div className={styles.box}>
        <div className={styles.boxHeader}><span className={styles.boxTitle}>Top Orders</span></div>
        <table className={styles.table}>
          <thead><tr>
            <th className={styles.th}>Order</th>
            <th className={styles.th}>Table</th>
            <th className={styles.th}>Staff</th>
            <th className={styles.th}>Date</th>
            <th className={styles.th}>Total</th>
          </tr></thead>
          <tbody>
            {topOrders?.map((o, i) => (
              <tr key={i} className={styles.tr}>
                <td className={styles.td}><span className={[styles.badge, styles.badgeBlack].join(' ')}>#{o.order_number}</span></td>
                <td className={styles.td}>Table {o.table_number || '—'}</td>
                <td className={styles.td} style={{ fontSize: 12 }}>{o.employee}</td>
                <td className={styles.td} style={{ fontSize: 11, color: '#64748b' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                <td className={styles.td}><strong>₹{parseFloat(o.total).toFixed(0)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}