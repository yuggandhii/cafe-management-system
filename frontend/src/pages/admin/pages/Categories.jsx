import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import styles from '../Dashboard.module.css';
import toast from 'react-hot-toast';

const COLORS = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function Categories() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#f59e0b' });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/categories', data),
    onSuccess: () => { qc.invalidateQueries(['categories']); toast.success('Category created'); setShowModal(false); setForm({ name: '', color: '#f59e0b' }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries(['categories']); toast.success('Category deleted'); },
    onError: () => toast.error('Cannot delete — has products'),
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Categories</div>
          <div className={styles.pageSub}>{categories?.length ?? 0} categories</div>
        </div>
        <button className={styles.actionBtn} onClick={() => setShowModal(true)}>+ New Category</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {categories?.map(c => (
          <div key={c.id} className={styles.kpiCard} style={{ borderLeft: `6px solid ${c.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ width: 16, height: 16, background: c.color, border: '2px solid #000', borderRadius: '50%' }} />
              <button className={[styles.actionBtn, styles.actionBtnSm, styles.actionBtnDanger].join(' ')} onClick={() => deleteMutation.mutate(c.id)}>Delete</button>
            </div>
            <div className={styles.kpiValue} style={{ fontSize: 20 }}>{c.name}</div>
            <div className={styles.kpiSub}>Sequence #{c.sequence}</div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>New Category</span>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formField} style={{ marginBottom: 16 }}>
                <label className={styles.formLabel}>Category Name</label>
                <input className={styles.formInput} placeholder="e.g. Beverages" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Color</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      style={{ width: 32, height: 32, background: c, border: form.color === c ? '4px solid #000' : '2px solid #e2e8f0', borderRadius: '50%', cursor: 'pointer', transform: form.color === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 150ms' }} />
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={[styles.actionBtn, styles.actionBtnGhost].join(' ')} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.actionBtn} onClick={() => createMutation.mutate(form)}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}