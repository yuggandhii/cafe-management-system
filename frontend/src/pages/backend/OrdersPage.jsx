import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { DataTable } from '../../components/DataTable';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';

export default function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: async () => {
      const res = await api.get('/orders', { params: { status } });
      return res.data.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders']);
      toast.success('Order marked as completed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update order');
    }
  });

  const handleMarkComplete = (e, id) => {
    e.stopPropagation();
    updateStatusMutation.mutate({ id, status: 'paid' });
  };

  const columns = [
    { header: 'Order #', cell: r => `#${r.order_number}` },
    { header: 'Table', accessor: 'table_number' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Total', cell: r => `₹${parseFloat(r.total).toFixed(2)}` },
    { header: 'Status', cell: r => <Badge variant={r.status}>{r.status.toUpperCase()}</Badge> },
    { header: 'Time', cell: r => format(new Date(r.created_at), 'dd MMM, HH:mm') },
    { 
      header: 'Actions', 
      cell: r => r.status === 'draft' && (
        <Button 
          size="sm" 
          variant="primary" 
          className="bg-success"
          style={{ background: '#22c55e', borderColor: '#22c55e' }}
          onClick={(e) => handleMarkComplete(e, r.id)}
          loading={updateStatusMutation.isPending && updateStatusMutation.variables?.id === r.id}
        >
          Mark Complete
        </Button>
      )
    },
  ];

  return (
    <div>
      <div className="page-header mb-6">
        <h1>Orders</h1>
        <div className="flex gap-2">
          <button className={`btn btn-sm ${status === '' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatus('')}>All Statuses</button>
          <button className={`btn btn-sm ${status === 'draft' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatus('draft')}>Pending Orders</button>
          <button className={`btn btn-sm ${status === 'paid' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatus('paid')}>Completed Orders</button>
        </div>
      </div>
      <div className="card">
        <DataTable 
          columns={columns} 
          data={orders} 
          isLoading={isLoading} 
          onRowClick={(r) => navigate(`/backend/orders/${r.id}`)}
        />
      </div>
    </div>
  );
}
