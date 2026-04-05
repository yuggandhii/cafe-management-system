import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { DataTable } from '../../components/DataTable';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#E6F1FB');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories');
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/products/categories', data),
    onSuccess: () => {
      toast.success('Category created');
      setName('');
      queryClient.invalidateQueries(['categories']);
    }
  });

  return (
    <div>
      <div className="page-header mb-6">
        <h1>Product Categories</h1>
        <p>Manage POS item categories</p>
      </div>

      <div className="card mb-6 flex gap-3 align-end" style={{ maxWidth: 600 }}>
        <Input label="Category Name" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1 }} />
        <Input label="Color Hex" type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 80, padding: 4 }} />
        <Button onClick={() => createMutation.mutate({ name, color })} disabled={!name}>Add Category</Button>
      </div>

      <div className="card">
        <DataTable 
          columns={[
            { header: 'Sequence', accessor: 'sequence' },
            { header: 'Name', accessor: 'name' },
            { header: 'Color', cell: (r) => (
              <div className="flex align-center gap-2">
                <div style={{ width: 16, height: 16, background: r.color, border: '1px solid #ccc' }} />
                <span>{r.color}</span>
              </div>
            )}
          ]} 
          data={categories} 
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
