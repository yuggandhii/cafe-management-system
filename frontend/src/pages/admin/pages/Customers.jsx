import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import styles from '../Dashboard.module.css';

export default function Customers() {
  const [search, setSearch] = useState('');

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get('/customers', { params: { search, limit: 100 } }).then(r => r.data.data),
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Customers</div>
          <div className={styles.pageSub}>{customers?.length ?? 0} registered customers</div>
        </div>
      </div>

      <div className={styles.searchBar}>
        <input className={styles.searchInput} placeholder="Search by name, email or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className={styles.box}>
        <div className={styles.boxHeader}>
          <span className={styles.boxTitle}>All Customers</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Phone</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>City</th>
                <th className={styles.th}>Visits</th>
                <th className={styles.th}>Total Spent</th>
                <th className={styles.th}>Type</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className={styles.td} colSpan={7} style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : customers?.map(c => (
                <tr key={c.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: '#facc15', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{c.state}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>{c.phone || '—'}</td>
                  <td className={styles.td} style={{ fontSize: 12 }}>{c.email || '—'}</td>
                  <td className={styles.td}>{c.city || '—'}</td>
                  <td className={styles.td}>
                    <span className={[styles.badge, c.visit_count >= 5 ? styles.badgePaid : styles.badgeDraft].join(' ')}>
                      {c.visit_count} visits
                    </span>
                  </td>
                  <td className={styles.td}><strong>₹{parseFloat(c.total_sales || 0).toFixed(0)}</strong></td>
                  <td className={styles.td}>
                    <span className={[styles.badge, c.visit_count >= 5 ? styles.badgeAmber : styles.badgeBlue].join(' ')}>
                      {c.visit_count >= 5 ? 'Regular' : 'New'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}