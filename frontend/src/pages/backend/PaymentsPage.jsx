import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../../api/axios';
import { DataTable } from '../../components/DataTable';
import { Badge } from '../../components/Badge';

export default function PaymentsPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const res = await api.get('/payments');
      return res.data.data;
    }
  });

  const columns = [
    { header: 'Ref', accessor: 'reference' },
    { header: 'Order #', cell: r => `#${r.order_number}` },
    { header: 'Method', cell: r => <Badge variant={r.method}>{r.method.toUpperCase()}</Badge> },
    { header: 'Amount', cell: r => `₹${parseFloat(r.amount).toFixed(2)}` },
    { header: 'Time', cell: r => format(new Date(r.created_at), 'dd MMM, HH:mm') },
  ];

  return (
    <div>
      <div className="page-header mb-6">
        <h1>Payments</h1>
        <p>Successful transactions log</p>
      </div>
      <div className="card">
        <DataTable columns={columns} data={payments} isLoading={isLoading} />
      </div>
    </div>
  );
}
