import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useToast } from '../../components/Toast';
import api from '../../api/axios';

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
  });

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data.data),
    enabled: !!isEdit,
  });

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: '', price: 0, tax_percent: 5, is_active: true, variants: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });

  useEffect(() => {
    if (product) reset({ ...product, variants: product.variants || [] });
  }, [product, reset]);

  const save = useMutation({
    mutationFn: (data) =>
      isEdit ? api.put(`/products/${id}`, data) : api.post('/products', data),
    onSuccess: () => {
      qc.invalidateQueries(['products']);
      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate('/backend/products');
    },
    onError: () => toast.error('Save failed'),
  });

  return (
    <AdminLayout title={isEdit ? 'Edit Product' : 'New Product'}>
      <form onSubmit={handleSubmit((d) => save.mutate(d))}>
        <div className="tabs">
          {['general', 'variants'].map((t) => (
            <button key={t} type="button" className={`tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'general' ? 'General Info' : 'Variants'}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
          <div className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className={`form-input${errors.name ? ' error' : ''}`} {...register('name', { required: 'Required' })} />
                  {errors.name && <span className="form-error">{errors.name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" {...register('category_id')}>
                    <option value="">— None —</option>
                    {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input type="number" step="0.01" className="form-input" {...register('price', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax %</label>
                  <input type="number" step="0.01" className="form-input" {...register('tax_percent', { valueAsNumber: true })} />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" {...register('is_active')} />
                  <span className="form-label" style={{ marginBottom: 0 }}>Active (visible on POS)</span>
                </label>
              </div>

              <div style={{ background: 'var(--surface-2)', border: '1px dashed var(--border-2)', padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                📷 Product Image — Upload coming soon
              </div>
            </div>
          </div>
        )}

        {activeTab === 'variants' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Product Variants</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => append({ attribute_name: 'Size', value: '', unit: '', extra_price: 0 })}>
                + Add Variant
              </button>
            </div>
            <div className="card-body">
              {fields.length === 0 && (
                <div className="empty-state"><span>No variants. Click + Add Variant to add one.</span></div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {fields.map((field, i) => (
                  <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 100px 36px', gap: 8, alignItems: 'center' }}>
                    <input className="form-input" placeholder="Attribute (e.g. Size)" {...register(`variants.${i}.attribute_name`)} />
                    <input className="form-input" placeholder="Value (e.g. Large)" {...register(`variants.${i}.value`)} />
                    <input className="form-input" placeholder="Unit" {...register(`variants.${i}.unit`)} />
                    <input type="number" step="0.01" className="form-input" placeholder="Extra ₹" {...register(`variants.${i}.extra_price`, { valueAsNumber: true })} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(i)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/backend/products')}>
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
