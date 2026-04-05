import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import usePosStore from '../../store/posStore';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

export default function OrderScreen() {
  const { config_id, table_id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const { currentSession, setSession, cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal } = usePosStore();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');

  // Always fetch active session from API — don't rely solely on Zustand (lost on page refresh)
  const { data: activeSession } = useQuery({
    queryKey: ['active-session', config_id],
    queryFn: () => api.get(`/sessions/config/${config_id}/active`).then((r) => r.data.data),
    staleTime: 30000,
  });

  // Sync fetched session into store
  useEffect(() => {
    if (activeSession && !currentSession) {
      setSession(activeSession);
    }
  }, [activeSession, currentSession, setSession]);

  // Use store session if available, otherwise fall back to API result
  const session = currentSession || activeSession;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () =>
      api
        .get('/products', {
          params: { is_active: true, category_id: selectedCategory || undefined },
        })
        .then((r) => r.data.data),
  });

  const { data: table } = useQuery({
    queryKey: ['table', table_id],
    queryFn: () =>
      api.get('/floors/tables/all').then((r) => r.data.data.find((t) => t.id === table_id)),
  });

  // Check for existing draft order on this table
  useEffect(() => {
    if (!session?.id) return;
    api
      .get('/orders', { params: { session_id: session.id, table_id } })
      .then((res) => {
        const existing = res.data.data.find(
          (o) => o.status === 'draft' || o.status === 'sent_to_kitchen'
        );
        if (existing) setCurrentOrder(existing);
      })
      .catch(() => {});
  }, [session?.id, table_id]);

  const sendToKitchen = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (!session) return toast.error('No active session. Please open a session first.');
    setSending(true);
    try {
      let order = currentOrder;

      // Create order if none exists
      if (!order) {
        const res = await api.post('/orders', {
          session_id: session.id,
          table_id,
        });
        order = res.data.data;
        setCurrentOrder(order);
      }

      // Add all cart lines
      for (const item of cart) {
        await api.post(`/orders/${order.id}/lines`, {
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_percent: item.tax_percent,
          note: note || null,
        });
      }

      // Send to kitchen
      await api.post(`/kitchen/send/${order.id}`);

      clearCart();
      setNote('');
      toast.success('Order sent to kitchen!');
      qc.invalidateQueries(['orders']);

      // Refresh order
      const refreshed = await api.get(`/orders/${order.id}`);
      setCurrentOrder(refreshed.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send order');
    } finally {
      setSending(false);
    }
  };

  const goToPayment = () => {
    if (!currentOrder) return toast.error('No active order');
    navigate(`/pos/${config_id}/payment/${currentOrder.id}`);
  };

  const totals = cartTotal();

  return (
    <div className="pos-layout">
      {/* Left: Categories + Products */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            height: 56,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 12,
          }}
        >
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/pos/${config_id}`)}>
            ← Floor
          </button>
          <span style={{ fontWeight: 700 }}>Table {table?.table_number || '...'}</span>
          {currentOrder && (
            <span className="badge badge-info">Order #{currentOrder.order_number}</span>
          )}
          {!session && (
            <span className="badge badge-warning">No Session</span>
          )}
        </div>

        {/* Category bar */}
        <div
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            overflowX: 'auto',
            padding: '0 4px',
            flexShrink: 0,
          }}
        >
          <button
            className={`tab${!selectedCategory ? ' active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              className={`tab${selectedCategory === cat.id ? ' active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                borderBottomColor: selectedCategory === cat.id ? cat.color : 'transparent',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--surface-2)' }}>
          {!products ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍽️</div>
              <div className="empty-state-title">No products in this category</div>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => addToCart(product)}
                >
                  <div className="product-img-placeholder">
                    <span>{product.category_name?.[0] || '?'}</span>
                  </div>
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">₹{parseFloat(product.price).toFixed(0)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="cart-panel">
        <div className="cart-header">🛒 Cart {cart.length > 0 && `(${cart.length})`}</div>

        <div className="cart-items">
          {cart.length === 0 && (
            <div className="empty-state" style={{ padding: 32 }}>
              <div>Click a product to add it</div>
            </div>
          )}
          {cart.map((item) => (
            <div key={item.key} className="cart-item">
              <div className="cart-item-info">
                <div className="cart-item-name">{item.product_name}</div>
                {item.variant_label && (
                  <div className="cart-item-variant">{item.variant_label}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>₹{item.unit_price} each</div>
              </div>
              <div className="cart-item-qty">
                <button
                  className="qty-btn"
                  onClick={() => updateQty(item.key, item.quantity - 1)}
                >
                  −
                </button>
                <span
                  style={{ minWidth: 20, textAlign: 'center', fontSize: 14, fontWeight: 600 }}
                >
                  {item.quantity}
                </span>
                <button
                  className="qty-btn"
                  onClick={() => updateQty(item.key, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <div className="cart-item-total">₹{item.total.toFixed(0)}</div>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => removeFromCart(item.key)}
                style={{ fontSize: 12 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          <div className="cart-totals">
            <div className="cart-total-row">
              <span>Subtotal</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-total-row">
              <span>Tax (5%)</span>
              <span>₹{totals.tax.toFixed(2)}</span>
            </div>
            <div className="cart-total-row grand">
              <span>Total</span>
              <span>₹{totals.total.toFixed(2)}</span>
            </div>
          </div>

          <textarea
            className="form-textarea"
            placeholder="Order note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            style={{ fontSize: 12 }}
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={sendToKitchen}
              disabled={sending || cart.length === 0}
            >
              {sending ? '⏳ Sending...' : '🍳 Send to Kitchen'}
            </button>
          </div>

          {currentOrder && (
            <button
              className="btn btn-success"
              style={{ width: '100%' }}
              onClick={goToPayment}
            >
              💳 Pay — ₹{parseFloat(currentOrder.total).toFixed(2)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
