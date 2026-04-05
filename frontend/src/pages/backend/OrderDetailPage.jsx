import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../../api/axios';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`);
      return res.data.data;
    }
  });

  if (isLoading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header mb-6">
        <div>
          <h1>Order #{order.order_number}</h1>
          <p>{format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/backend/orders')}>Back</Button>
      </div>

      <div className="form-grid mb-6">
        <div className="card">
          <h3 className="mb-2">Details</h3>
          <p><strong>Status:</strong> <Badge variant={order.status}>{order.status.toUpperCase()}</Badge></p>
          <p className="mt-2"><strong>Table:</strong> {order.table_number || 'N/A'}</p>
          <p className="mt-2"><strong>Customer:</strong> {order.customer_name || 'Walk-in'}</p>
          <p className="mt-2"><strong>Staff:</strong> {order.staff_name}</p>
        </div>
        <div className="card">
          <h3 className="mb-2">Financials</h3>
          <p><strong>Subtotal:</strong> ₹{order.subtotal}</p>
          <p className="mt-2"><strong>Tax Amount:</strong> ₹{order.tax_amount}</p>
          <p className="mt-2 text-primary font-bold" style={{ fontSize: 18 }}><strong>Total:</strong> ₹{order.total}</p>
        </div>
      </div>

      <div className="card">
        <h3>Order Items</h3>
        <table className="mt-4">
          <thead>
            <tr>
              <th>Item</th>
              <th>Variant</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.lines || []).map(l => (
              <tr key={l.id}>
                <td>{l.product_name}</td>
                <td>{l.variant_value ? `${l.variant_attr}: ${l.variant_value}` : '-'}</td>
                <td>{l.quantity}</td>
                <td>₹{parseFloat(l.unit_price).toFixed(2)}</td>
                <td className="text-right">₹{parseFloat(l.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
