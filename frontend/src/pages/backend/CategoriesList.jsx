import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/AdminLayout';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import api from '../../api/axios';

const PRESET_COLORS = ['#E74C3C', '#9B59B6', '#E67E22', '#D35400', '#27AE60', '#F39C12', '#16A085', '#8B4513', '#2980B9', '#1ABC9C', '#7F8C8D'];

export default function CategoriesList() {
  const toast = useToast();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', data? }
  const [form, setForm] = useState({ name: '', color: '#4A90E2' });

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
  });

  const save = useMutation({
    mutationFn: (d) => modal?.data
      ? api.put(`/categories/${modal.data.id}`, d)
      : api.post('/categories', d),
    onSuccess: () => { qc.invalidateQueries(['categories']); toast.success('Saved'); setModal(null); },
    onError: () => toast.error('Save failed'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries(['categories']); toast.success('Deleted'); },
    onError: () => toast.error('Cannot delete — products may reference this category'),
  });

  const openAdd = () => { setForm({ name: '', color: '#4A90E2' }); setModal({ mode: 'add' }); };
  const openEdit = (cat) => { setForm({ name: cat.name, color: cat.color }); setModal({ mode: 'edit', data: cat }); };

  return (
    <AdminLayout title="Categories" actions={
      <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Category</button>
    }>
      {isLoading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="card-header"><span className="card-title">Product Categories ({data?.length})</span></div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Name</th>
                <th>Sequence</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((cat) => (
                <tr key={cat.id}>
                  <td><span className="color-swatch" style={{ background: cat.color }} /></td>
                  <td><strong>{cat.name}</strong></td>
                  <td>{cat.sequence}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cat)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => del.mutate(cat.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate(form)} disabled={save.isPending}>Save</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c,
                    border: form.color === c ? '3px solid var(--text)' : '2px solid var(--border)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
