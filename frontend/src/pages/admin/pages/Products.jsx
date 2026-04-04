import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import styles from '../Dashboard.module.css';
import toast from 'react-hot-toast';

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category_id: '', price: '', tax_percent: '5', unit_of_measure: 'Piece', description: '' });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get('/products', { params: { search, limit: 100 } }).then(r => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/products', data),
    onSuccess: () => {
      qc.invalidateQueries(['products']);
      toast.success('Product created');
      setShowModal(false);
      setForm({ name: '', category_id: '', price: '', tax_percent: '5', unit_of_measure: 'Piece', description: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/products/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Status updated'); },
  });

  const UNITS = ['Piece', 'Plate', 'Cup', 'Glass', 'Bottle', 'Scoop', 'Slice', 'Bowl'];
  const TAXES = ['0', '5', '12', '18', '28'];

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Products</div>
          <div className={styles.pageSub}>{products?.length ?? 0} menu items</div>
        </div>
        <button className={styles.actionBtn} onClick={() => setShowModal(true)}>+ New Product</button>
      </div>

      <div className={styles.searchBar}>
        <input className={styles.searchInput} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className={styles.box}>
        <div className={styles.boxHeader}>
          <span className={styles.boxTitle}>All Products</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Product</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Price</th>
                <th className={styles.th}>Tax</th>
                <th className={styles.th}>Unit</th>
                <th className={styles.th}>Description</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className={styles.td} colSpan={8} style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : products?.map(p => (
                <tr key={p.id} className={styles.tr}>
                  <td className={styles.td}><strong>{p.name}</strong></td>
                  <td className={styles.td}>
                    <span className={styles.badge} style={{ background: p.category_color || '#f1f5f9', color: '#000', borderColor: '#000', fontSize: 9 }}>
                      {p.category_name || '—'}
                    </span>
                  </td>
                  <td className={styles.td}><strong>₹{parseFloat(p.price).toFixed(0)}</strong></td>
                  <td className={styles.td}>{p.tax_percent}%</td>
                  <td className={styles.td} style={{ fontSize: 12, color: '#64748b' }}>{p.unit_of_measure}</td>
                  <td className={styles.td} style={{ fontSize: 11, color: '#64748b', maxWidth: 160 }}>{p.description || '—'}</td>
                  <td className={styles.td}>
                    <span className={[styles.badge, p.is_active ? styles.badgePaid : styles.badgeDraft].join(' ')}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <button className={[styles.actionBtn, styles.actionBtnSm, !p.is_active ? '' : styles.actionBtnDanger].join(' ')}
                      onClick={() => toggleMutation.mutate(p.id)}>
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>New Product</span>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={[styles.formField, styles.formGridFull].join(' ')}>
                  <label className={styles.formLabel}>Product Name</label>
                  <input className={styles.formInput} placeholder="e.g. Butter Chicken" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Category</label>
                  <select className={styles.formInput} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Select category</option>
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Price (₹)</label>
                  <input className={styles.formInput} type="number" placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Tax %</label>
                  <select className={styles.formInput} value={form.tax_percent} onChange={e => setForm({ ...form, tax_percent: e.target.value })}>
                    {TAXES.map(t => <option key={t} value={t}>{t}%</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Unit</label>
                  <select className={styles.formInput} value={form.unit_of_measure} onChange={e => setForm({ ...form, unit_of_measure: e.target.value })}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className={[styles.formField, styles.formGridFull].join(' ')}>
                  <label className={styles.formLabel}>Description</label>
                  <input className={styles.formInput} placeholder="Short description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={[styles.actionBtn, styles.actionBtnGhost].join(' ')} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.actionBtn} onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}