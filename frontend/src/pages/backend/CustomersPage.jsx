import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { search } });
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/customers', data),
    onSuccess: () => {
      toast.success('Customer added');
      setModalOpen(false);
      setFormData({ name: '', phone: '', email: '' });
      queryClient.invalidateQueries(['customers']);
    }
  });

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Email', accessor: 'email' },
    { header: 'Total Spent', cell: r => `₹${parseFloat(r.total_sales).toFixed(2)}` },
  ];

  return (
    <div>
      <div className="page-header mb-6">
        <div>
          <h1>Customers</h1>
          <p>Client database and history</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Add Customer</Button>
      </div>

      <div className="card mb-4" style={{ maxWidth: 400 }}>
        <Input 
          placeholder="Search name, phone, or email..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="card">
        <DataTable columns={columns} data={customers} isLoading={isLoading} />
      </div>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Add Customer"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || createMutation.isPending}
            >
              Save
            </Button>
          </>
        )}
      >
        <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
          <Input label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          <Input label="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
