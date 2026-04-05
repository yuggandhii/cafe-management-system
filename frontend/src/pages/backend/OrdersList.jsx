import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import { useToast } from '../../components/Toast';
import api from '../../api/axios';

const STATUS_OPTIONS = ['', 'draft', 'sent_to_kitchen', 'paid', 'cancelled'];

export default function OrdersList() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => api.get('/orders', { params: { status: statusFilter || undefined } }).then((r) => r.data.data),
  });

  const columns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'table_number', label: 'Table', render: (v) => v || 'Takeaway' },
    { key: 'customer_name', label: 'Customer', render: (v) => v || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <Badge status={v} />,
    },
    { key: 'total', label: 'Total', render: (v) => `₹${parseFloat(v).toFixed(2)}` },
    {
      key: 'created_at',
      label: 'Time',
      render: (v) => new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
    {
      key: 'id',
      label: '',
      render: (id) => <Link to={`/backend/orders/${id}`} className="btn btn-secondary btn-sm">View</Link>,
    },
  ];

  return (
    <AdminLayout
      title="Orders"
      actions={
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      }
    >
      <div className="card">
        <DataTable columns={columns} data={data} loading={isLoading} emptyMessage="No orders yet" />
      </div>
    </AdminLayout>
  );
}
