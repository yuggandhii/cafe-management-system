import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { usePosStore } from '../../store/posStore';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

// ── Emoji helper (mirrors customer display) ──────────────────────────────
const catEmoji = {
  coffee: '☕', espresso: '☕', latte: '🥛', tea: '🍵', frappe: '🧋',
  smoothie: '🥤', juice: '🍹', food: '🍽️', snack: '🍪', pastry: '🥐',
  sandwich: '🥪', cake: '🎂', dessert: '🍰', water: '💧', soda: '🥤',
};
const getEmoji = (name = '') => {
  const n = name.toLowerCase();
  for (const [k, v] of Object.entries(catEmoji)) if (n.includes(k)) return v;
  return '☕';
};

export default function PosOrderScreen() {
  const { config_id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentOrder, activeTable } = usePosStore();

  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantModal, setVariantModal] = useState(false);
  const [customerModal, setCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoMockRating, setInfoMockRating] = useState('4.8');

  // ── Data queries ────────────────────────────────────────────────────────
  const { data: order } = useQuery({
    queryKey: ['order-detailed', currentOrder?.id],
    queryFn: async () => {
      const r = await api.get(`/orders/${currentOrder.id}`);
      return r.data.data;
    },
    enabled: !!currentOrder?.id,
    refetchInterval: 2500,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/products/categories')).data.data,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', activeCategory, search],
    queryFn: async () =>
      (await api.get('/products', { params: { category_id: activeCategory, search, limit: 200 } })).data.data,
  });

  const { data: allCustomers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => (await api.get('/customers', { params: { limit: 100 } })).data.data,
  });

  // ── Mutations ───────────────────────────────────────────────────────────
  const addLine = useMutation({
    mutationFn: (data) => api.post(`/orders/${order.id}/lines`, data),
    onSuccess: () => qc.invalidateQueries(['order-detailed']),
    onError: () => toast.error('Could not add item'),
  });

  const updateLine = useMutation({
    mutationFn: ({ line_id, quantity }) =>
      api.put(`/orders/${order.id}/lines/${line_id}`, { quantity }),
    onSuccess: () => qc.invalidateQueries(['order-detailed']),
  });

  const deleteLine = useMutation({
    mutationFn: (line_id) => api.delete(`/orders/${order.id}/lines/${line_id}`),
    onSuccess: () => qc.invalidateQueries(['order-detailed']),
  });

  const setCustomer = useMutation({
    mutationFn: (customer_id) => api.patch(`/orders/${order.id}/customer`, { customer_id }),
    onSuccess: () => {
      toast.success('Customer assigned');
      setCustomerModal(false);
      qc.invalidateQueries(['order-detailed']);
    },
  });

  const sendKitchen = useMutation({
    mutationFn: () => api.post(`/kitchen/send/${order.id}`),
    onSuccess: () => toast.success('🍳 Sent to kitchen!'),
  });

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleProductClick = async (product) => {
    try {
      const res = await api.get(`/products/${product.id}`);
      const full = res.data.data;
      if (full.variants?.length) {
        setSelectedProduct(full);
        setSelectedVariant(null);
        setVariantModal(true);
      } else {
        addLine.mutate({ product_id: product.id, quantity: 1 });
        toast.success(`Added ${product.name}`, { duration: 1000, icon: '✅' });
      }
    } catch {
      toast.error('Could not load product');
    }
  };

  const handleInfoClick = (e, product) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setInfoMockRating((Math.random() * (5.0 - 4.2) + 4.2).toFixed(1));
    setInfoModalOpen(true);
    
    // Auto-update rating exactly like the customer portal
    const interval = setInterval(() => {
      setInfoMockRating((Math.random() * (5.0 - 4.2) + 4.2).toFixed(1));
    }, 5000);
    // Cleanup will just be approximate, tying it to window/component or we can just clearInterval in useEffect
    window._lastDemoInterval && clearInterval(window._lastDemoInterval);
    window._lastDemoInterval = interval;
  };

  const handleAddVariant = () => {
    if (!selectedVariant) return toast.error('Please select a variant');
    addLine.mutate({ product_id: selectedProduct.id, variant_id: selectedVariant.id, quantity: 1 });
    setVariantModal(false);
    toast.success(`Added ${selectedProduct.name}`, { duration: 1000, icon: '✅' });
  };

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustomers = allCustomers.filter(c =>
    !customerSearch ||
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  const lineCount = order?.lines?.reduce((s, l) => s + l.quantity, 0) || 0;

  if (!currentOrder) {
    return (
      <div className="pos-no-order">
        <div>⚠️</div>
        <p>No active order. Go back and select a table.</p>
        <button className="pos-back-btn" onClick={() => navigate(`/pos/${config_id}`)}>
          ← Back to Floor
        </button>
      </div>
    );
  }

  return (
    <div className="pos2-layout colorful-staff-ui">

      {/* ══ LEFT: MENU ══════════════════════════════════════════════════ */}
      <div className="pos2-left">

        {/* Top bar */}
        <div className="pos2-topbar">
          <button className="pos2-back-btn" onClick={() => navigate(`/pos/${config_id}`)}>
            ← Floor
          </button>
          <div className="pos2-topbar-center">
            <span className="pos2-topbar-logo">☕</span>
            <span className="pos2-topbar-name">Cawfee Tawk</span>
            {activeTable && (
              <span className="pos2-table-badge">Table {activeTable.table_number}</span>
            )}
          </div>
          <div className="pos2-search-wrap">
            <span className="pos2-search-icon">🔍</span>
            <input
              className="pos2-search"
              type="text"
              placeholder="Search menu…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="pos2-cat-bar">
          <button
            className={`pos2-cat-pill ${!activeCategory ? 'active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >All</button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`pos2-cat-pill ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {getEmoji(c.name)} {c.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="pos2-product-scroll">
          {filteredProducts.length === 0 ? (
            <div className="pos2-empty-menu">
              <div>☕</div>
              <p>No items found</p>
            </div>
          ) : (
            <div className="pos2-product-grid">
              {filteredProducts.map(p => {
                const emoji = getEmoji(p.name + ' ' + (p.category_name || ''));
                const inCart = order?.lines?.find(l => l.product_id === p.id);
                return (
                  <div
                    key={p.id}
                    className={`pos2-prod-card animate-scale-in ${inCart ? 'in-cart' : ''}`}
                    style={{ animationDelay: `${Math.min(filteredProducts.indexOf(p) * 0.03, 0.3)}s` }}
                    onClick={() => handleProductClick(p)}
                  >
                    <div 
                      className="pos2-prod-info-btn" 
                      onClick={(e) => handleInfoClick(e, p)}
                      title="View Product Ingredients & Live Ratings"
                    >ℹ️</div>
                    {inCart && <div className="pos2-in-cart-badge animate-scale-in">{inCart.quantity}</div>}
                    <div className="pos2-prod-emoji">{emoji}</div>
                    <div className="pos2-prod-name">{p.name}</div>
                    <div className="pos2-prod-price">₹{parseFloat(p.price).toFixed(0)}</div>
                    <div className="pos2-add-hint">+ Add</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT: CART ══════════════════════════════════════════════════ */}
      <div className="pos2-right">

        {/* Cart header */}
        <div className="pos2-cart-header">
          <div>
            <div className="pos2-cart-title">Order #{order?.order_number || '…'}</div>
            <div className="pos2-cart-sub">
              {activeTable ? `Table ${activeTable.table_number}` : 'Walk-in'}
              {order?.customer_name && ` · ${order.customer_name}`}
            </div>
          </div>
          <button
            className="pos2-customer-btn"
            onClick={() => setCustomerModal(true)}
            title="Assign customer"
          >
            👤
          </button>
        </div>

        {/* Cart lines */}
        <div className="pos2-cart-lines">
          {order?.lines?.length ? order.lines.map(l => (
            <div key={l.id} className="pos2-cart-item">
              <div className="pos2-ci-emoji">{getEmoji(l.product_name)}</div>
              <div className="pos2-ci-info">
                <div className="pos2-ci-name">{l.product_name}</div>
                {l.variant_value && (
                  <div className="pos2-ci-variant">{l.variant_attr}: {l.variant_value}</div>
                )}
              </div>
              <div className="pos2-ci-qty-ctrl">
                <button
                  className="pos2-qty-btn"
                  onClick={() => {
                    if (l.quantity <= 1) deleteLine.mutate(l.id);
                    else updateLine.mutate({ line_id: l.id, quantity: l.quantity - 1 });
                  }}
                >−</button>
                <span className="pos2-qty-val">{l.quantity}</span>
                <button
                  className="pos2-qty-btn"
                  onClick={() => updateLine.mutate({ line_id: l.id, quantity: l.quantity + 1 })}
                >+</button>
              </div>
              <div className="pos2-ci-price">₹{parseFloat(l.total).toFixed(2)}</div>
            </div>
          )) : (
            <div className="pos2-cart-empty">
              <div>🛒</div>
              <p>Cart is empty<br /><small>Tap a product to add it</small></p>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="pos2-cart-totals">
          <div className="pos2-tot-row">
            <span>Subtotal</span>
            <span>₹{parseFloat(order?.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="pos2-tot-row">
            <span>Tax</span>
            <span>₹{parseFloat(order?.tax_amount || 0).toFixed(2)}</span>
          </div>
          <div className="pos2-tot-row pos2-tot-grand">
            <span>Total</span>
            <span>₹{parseFloat(order?.total || 0).toFixed(2)}</span>
          </div>
          {lineCount > 0 && (
            <div className="pos2-item-count">{lineCount} item{lineCount !== 1 ? 's' : ''}</div>
          )}
        </div>

        {/* Actions */}
        <div className="pos2-cart-actions">
          <button
            className="pos2-action-btn pos2-kitchen-btn"
            onClick={() => sendKitchen.mutate()}
            disabled={!order?.lines?.length || sendKitchen.isPending}
          >
            🍳 Send to Kitchen
          </button>
          <button
            className="pos2-action-btn pos2-pay-btn"
            onClick={() => navigate(`/pos/${config_id}/payment/${order.id}`)}
            disabled={!order?.lines?.length}
          >
            💳 Pay Now
          </button>
        </div>
      </div>

      {/* ══ VARIANT MODAL ════════════════════════════════════════════════ */}
      <Modal
        isOpen={variantModal}
        onClose={() => setVariantModal(false)}
        title={`Choose variant — ${selectedProduct?.name}`}
      >
        <div className="pos2-variant-list">
          {selectedProduct?.variants?.map(v => (
            <div
              key={v.id}
              className={`pos2-variant-item ${selectedVariant?.id === v.id ? 'selected' : ''}`}
              onClick={() => setSelectedVariant(v)}
            >
              <div>
                <div className="pos2-vi-attr">{v.attribute_name}</div>
                <div className="pos2-vi-val">{v.value}</div>
              </div>
              {parseFloat(v.extra_price) > 0 && (
                <div className="pos2-vi-extra">+₹{parseFloat(v.extra_price).toFixed(0)}</div>
              )}
              {selectedVariant?.id === v.id && <div className="pos2-vi-check">✓</div>}
            </div>
          ))}
          <button
            className="pos2-action-btn pos2-pay-btn"
            style={{ marginTop: 12, width: '100%' }}
            onClick={handleAddVariant}
          >
            Add to Order
          </button>
        </div>
      </Modal>

      {/* ══ CUSTOMER MODAL ════════════════════════════════════════════════ */}
      <Modal
        isOpen={customerModal}
        onClose={() => setCustomerModal(false)}
        title="Assign Customer"
      >
        <input
          className="pos2-cust-search input-field"
          type="text"
          placeholder="Search by name or phone…"
          value={customerSearch}
          onChange={e => setCustomerSearch(e.target.value)}
          autoFocus
        />
        <div className="pos2-cust-list">
          {filteredCustomers.map(c => (
            <div
              key={c.id}
              className={`pos2-cust-item ${order?.customer_id === c.id ? 'selected' : ''}`}
              onClick={() => setCustomer.mutate(c.id)}
            >
              <div className="pos2-cust-avatar">
                {(c.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div className="pos2-cust-name">{c.name}</div>
                <div className="pos2-cust-meta">{c.phone || c.email || 'No contact info'}</div>
              </div>
              {order?.customer_id === c.id && <span className="pos2-cust-check">✓</span>}
            </div>
          ))}
          {!filteredCustomers.length && (
            <div className="pos2-cust-empty">No customers found</div>
          )}
        </div>
        {order?.customer_id && (
          <button
            className="pos2-cust-remove"
            onClick={() => setCustomer.mutate(null)}
          >
            Remove customer
          </button>
        )}
      </Modal>

      {/* ══ INFO MODAL ══════════════════════════════════════════════════ */}
      {infoModalOpen && selectedProduct && (
        <Modal 
          isOpen={true} 
          onClose={() => { setInfoModalOpen(false); setSelectedProduct(null); clearInterval(window._lastDemoInterval); }} 
          title="Product Details (Staff View)"
        >
          <div className="p-4 text-center">
            <div style={{fontSize: '64px', margin: '0 auto'}}>{getEmoji(selectedProduct.name)}</div>
            <h2 className="text-2xl font-bold mt-2" style={{color: '#3730A3'}}>{selectedProduct.name}</h2>
            <div className="text-xl font-semibold mt-1" style={{color: '#E65A28'}}>₹{parseFloat(selectedProduct.price).toFixed(2)}</div>
            
            <div className="flex gap-4 justify-center items-center mt-4 bg-indigo-50 p-4 rounded-xl">
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Live Live Rating</span>
                <span className="text-2xl font-bold" style={{color: '#2A8B46'}}>★ {infoMockRating} / 5</span>
              </div>
            </div>
            
            <div className="mt-6 text-left">
              <h4 className="font-bold text-sm text-indigo-400 uppercase mb-2">Ingredients</h4>
              <ul className="list-disc pl-5 text-indigo-900">
                <li>Premium Origin Blend</li>
                <li>Organic Milk options</li>
                <li>Artisanal Flavouring</li>
              </ul>
            </div>

            <Button size="lg" variant="primary" className="mt-6" block onClick={() => {
              handleProductClick(selectedProduct);
              setInfoModalOpen(false);
              clearInterval(window._lastDemoInterval);
            }}>
              Quick Add to Order
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
