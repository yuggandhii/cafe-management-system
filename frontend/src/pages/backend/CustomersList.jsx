import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/AdminLayout';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import { useToast } from '../../components/Toast';
import api from '../../api/axios';

export default function CustomersList() {
  const toast = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', state: '', country: 'India' });

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get('/customers', { params: { search: search || undefined } }).then((r) => r.data.data),
  });

  const save = useMutation({
    mutationFn: (d) => modal?.id
      ? api.put(`/customers/${modal.id}`, d)
      : api.post('/customers', d),
    onSuccess: () => { qc.invalidateQueries(['customers']); toast.success('Saved'); setModal(null); },
    onError: () => toast.error('Failed'),
  });

  const openAdd = () => {
    setForm({ name: '', email: '', phone: '', city: '', state: '', country: 'India' });
    setModal({ mode: 'add' });
  };

  const openEdit = (c) => {
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', city: c.city || '', state: c.state || '', country: c.country || 'India' });
    setModal({ mode: 'edit', id: c.id });
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone', render: (v) => v || '—' },
    { key: 'email', label: 'Email', render: (v) => v || '—' },
    { key: 'city', label: 'City', render: (v) => v || '—' },
    { key: 'total_sales', label: 'Total Spent', render: (v) => `₹${parseFloat(v).toFixed(2)}` },
    { key: 'id', label: '', render: (id, row) => (
      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(row)}>Edit</button>
    )},
  ];

  return (
    <AdminLayout
      title="Customers"
      actions={
        <>
          <input className="form-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add</button>
        </>
      }
    >
      <div className="card">
        <DataTable columns={columns} data={data} loading={isLoading} emptyMessage="No customers found" />
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Edit Customer' : 'Add Customer'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate(form)} disabled={save.isPending}>Save</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'name', label: 'Name', placeholder: 'Full name' },
            { key: 'phone', label: 'Phone', placeholder: '+91...' },
            { key: 'email', label: 'Email', placeholder: 'email@domain.com' },
            { key: 'city', label: 'City', placeholder: 'Mumbai' },
            { key: 'state', label: 'State', placeholder: 'Maharashtra' },
          ].map(({ key, label, placeholder }) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <input className="form-input" placeholder={placeholder} value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
      </Modal>
    </AdminLayout>
  );
}
