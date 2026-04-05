import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Button } from '../../components/Button';
import { DataTable } from '../../components/DataTable';
import { Badge } from '../../components/Badge';

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data.data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/products/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries(['products'])
  });

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Category', cell: r => <Badge style={{ background: r.category_color }}>{r.category_name}</Badge> },
    { header: 'Price', cell: r => `₹${parseFloat(r.price).toFixed(2)}` },
    { header: 'Kitchen?', cell: r => r.send_to_kitchen ? 'Yes' : 'No' },
    { header: 'Active', cell: r => r.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="draft">Inactive</Badge> },
    {
      header: 'Actions',
      cell: r => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/backend/products/${r.id}/edit`)}>Edit</Button>
          <Button size="sm" variant={r.is_active ? "danger" : "success"} onClick={() => toggleMutation.mutate(r.id)}>
            {r.is_active ? 'Disable' : 'Enable'}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header mb-6">
        <div>
          <h1>Products</h1>
          <p>Manage items and variants</p>
        </div>
        <Button onClick={() => navigate('/backend/products/new')}>Add Product</Button>
      </div>

      <div className="card">
        <DataTable columns={columns} data={products} isLoading={isLoading} />
      </div>
    </div>
  );
}
