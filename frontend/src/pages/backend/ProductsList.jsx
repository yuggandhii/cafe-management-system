import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import api from '../../api/axios';

export default function ProductsList() {
  const toast = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data.data),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Product deleted'); setDeleting(null); },
    onError: () => toast.error('Delete failed'),
  });

  const filtered = data?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'category_color',
      label: '',
      width: 8,
      render: (color) => (
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color || '#ccc' }} />
      ),
    },
    { key: 'name', label: 'Product' },
    { key: 'category_name', label: 'Category', render: (v) => v || '—' },
    { key: 'price', label: 'Price', render: (v) => `₹${parseFloat(v).toFixed(0)}` },
    { key: 'tax_percent', label: 'Tax', render: (v) => `${v}%` },
    {
      key: 'is_active',
      label: 'Status',
      render: (v) => (
        <span className={`badge ${v ? 'badge-success' : 'badge-default'}`}>{v ? 'Active' : 'Inactive'}</span>
      ),
    },
    {
      key: 'id',
      label: '',
      render: (id) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Link to={`/backend/products/${id}`} className="btn btn-secondary btn-sm">Edit</Link>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleting(id)}>Del</button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Products"
      actions={
        <>
          <input
            className="form-input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <Link to="/backend/products/new" className="btn btn-primary btn-sm">+ Add Product</Link>
        </>
      }
    >
      <div className="card">
        <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No products found" />
      </div>

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Product"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => del.mutate(deleting)} disabled={del.isPending}>
              {del.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this product? This action cannot be undone.</p>
      </Modal>
    </AdminLayout>
  );
}
