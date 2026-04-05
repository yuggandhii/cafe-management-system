import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ─── Tiny local cart hook ───────────────────────────────────────────────────
function useCart() {
  const [items, setItems] = useState([]);

  const add = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          tax_percent: parseFloat(product.tax_percent) || 0,
          quantity: 1,
          note: '',
        },
      ];
    });
  };

  const remove = (product_id) =>
    setItems((prev) => prev.filter((i) => i.product_id !== product_id));

  const updateQty = (product_id, qty) => {
    if (qty <= 0) return remove(product_id);
    setItems((prev) =>
      prev.map((i) => (i.product_id === product_id ? { ...i, quantity: qty } : i))
    );
  };

  const updateNote = (product_id, note) =>
    setItems((prev) =>
      prev.map((i) => (i.product_id === product_id ? { ...i, note } : i))
    );

  const clear = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = items.reduce(
    (s, i) => s + (i.price * i.quantity * i.tax_percent) / 100,
    0
  );
  const total = subtotal + tax;

  return { items, add, remove, updateQty, updateNote, clear, totalItems, subtotal, tax, total };
}

// ─── Screen components ────────────────────────────────────────────────────────

function LoadingScreen({ message = 'Loading menu…' }) {
  return (
    <div style={styles.centered}>
      <div style={styles.spinnerWrap}>
        <div style={styles.spinnerRing} />
      </div>
      <p style={{ marginTop: 20, color: '#6b7280', fontSize: 14 }}>{message}</p>
    </div>
  );
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div style={styles.centered}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
      <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, color: '#111827' }}>
        {message.includes('closed') ? 'Café Is Closed' : 'Something went wrong'}
      </h2>
      <p style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', maxWidth: 280, marginBottom: 24 }}>
        {message}
      </p>
      {onRetry && (
        <button style={styles.btnPrimary} onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

function CategoryBar({ categories, selected, onSelect }) {
  return (
    <div style={styles.catBar}>
      <button
        style={{ ...styles.catChip, ...(selected === null ? styles.catChipActive : {}) }}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          style={{
            ...styles.catChip,
            ...(selected === cat.id ? styles.catChipActive : {}),
            borderBottomColor: selected === cat.id ? (cat.color || '#4f46e5') : 'transparent',
          }}
          onClick={() => onSelect(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

function ProductCard({ product, qty, onAdd, onRemove }) {
  return (
    <div style={styles.productCard}>
      {/* Placeholder image */}
      <div style={{ ...styles.productImg, background: product.category_color || '#e5e7eb' }}>
        <span style={styles.productImgLetter}>
          {product.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div style={styles.productInfo}>
        <div style={styles.productName}>{product.name}</div>
        <div style={styles.productCat}>{product.category_name}</div>
        <div style={styles.productBottom}>
          <span style={styles.productPrice}>₹{parseFloat(product.price).toFixed(0)}</span>
          {qty === 0 ? (
            <button style={styles.addBtn} onClick={() => onAdd(product)}>
              + Add
            </button>
          ) : (
            <div style={styles.qtyControl}>
              <button style={styles.qtyBtn} onClick={() => onRemove(product.id)}>−</button>
              <span style={styles.qtyNum}>{qty}</span>
              <button style={styles.qtyBtn} onClick={() => onAdd(product)}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ cart, onClose, onPlaceOrder, placing }) {
  return (
    <>
      {/* Backdrop */}
      <div style={styles.backdrop} onClick={onClose} />
      {/* Drawer */}
      <div style={styles.drawer}>
        <div style={styles.drawerHeader}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>🛒 Your Order</span>
          <button style={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.drawerBody}>
          {cart.items.map((item) => (
            <div key={item.product_id} style={styles.cartRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>₹{item.price} × {item.quantity}</div>
                <input
                  style={styles.noteInput}
                  placeholder="Add a note (optional)"
                  value={item.note}
                  onChange={(e) => cart.updateNote(item.product_id, e.target.value)}
                />
              </div>
              <div style={styles.qtyControl}>
                <button
                  style={styles.qtyBtn}
                  onClick={() => cart.updateQty(item.product_id, item.quantity - 1)}
                >−</button>
                <span style={styles.qtyNum}>{item.quantity}</span>
                <button
                  style={styles.qtyBtn}
                  onClick={() => cart.updateQty(item.product_id, item.quantity + 1)}
                >+</button>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.drawerFooter}>
          <div style={styles.totalRow}>
            <span style={{ color: '#6b7280' }}>Subtotal</span>
            <span>₹{cart.subtotal.toFixed(2)}</span>
          </div>
          <div style={styles.totalRow}>
            <span style={{ color: '#6b7280' }}>Tax</span>
            <span>₹{cart.tax.toFixed(2)}</span>
          </div>
          <div style={{ ...styles.totalRow, fontWeight: 800, fontSize: 20, marginTop: 8 }}>
            <span>Total</span>
            <span style={{ color: '#4f46e5' }}>₹{cart.total.toFixed(2)}</span>
          </div>
          <button
            style={{ ...styles.btnPrimary, width: '100%', marginTop: 16, fontSize: 16, padding: '14px 0' }}
            onClick={onPlaceOrder}
            disabled={placing || cart.items.length === 0}
          >
            {placing ? '⏳ Placing Order…' : `✓ Place Order — ₹${cart.total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </>
  );
}

const STATUS_STEPS = [
  { key: 'sent_to_kitchen', label: 'Order Received', icon: '📋', desc: 'Your order is confirmed' },
  { key: 'preparing', label: 'Preparing', icon: '🍳', desc: 'Kitchen is preparing your food' },
  { key: 'ready', label: 'Ready!', icon: '✅', desc: 'Your order is ready' },
  { key: 'paid', label: 'Completed', icon: '🎉', desc: 'Thank you for dining with us!' },
];

function OrderTracker({ order, onReorder }) {
  const status = order.kitchen_status || order.status;
  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  const activeIndex = stepIndex >= 0 ? stepIndex : 0;

  return (
    <div style={styles.trackerWrap}>
      <div style={styles.trackerCard}>
        {/* Order # */}
        <div style={styles.trackerOrderNum}>
          <span style={styles.trackerNumLabel}>Order</span>
          <span style={styles.trackerNum}>#{order.order_number}</span>
        </div>
        <div style={styles.trackerTable}>Table {order.table_number}</div>

        {/* Status steps */}
        <div style={styles.steps}>
          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx < activeIndex;
            const isActive = idx === activeIndex;
            return (
              <div key={step.key} style={styles.step}>
                {/* Connector line */}
                {idx > 0 && (
                  <div
                    style={{
                      ...styles.stepLine,
                      background: isDone || isActive ? '#4f46e5' : '#e5e7eb',
                    }}
                  />
                )}
                <div
                  style={{
                    ...styles.stepDot,
                    background: isDone
                      ? '#4f46e5'
                      : isActive
                      ? '#fff'
                      : '#e5e7eb',
                    border: isActive
                      ? '3px solid #4f46e5'
                      : isDone
                      ? '3px solid #4f46e5'
                      : '3px solid #e5e7eb',
                    boxShadow: isActive ? '0 0 0 4px rgba(79,70,229,0.15)' : 'none',
                  }}
                >
                  {isDone ? '✓' : isActive ? '' : ''}
                </div>
                <div
                  style={{
                    ...styles.stepLabel,
                    color: isActive ? '#111827' : isDone ? '#4f46e5' : '#9ca3af',
                    fontWeight: isActive ? 700 : isDone ? 600 : 400,
                  }}
                >
                  {step.icon} {step.label}
                </div>
                {isActive && (
                  <div style={styles.stepDesc}>{step.desc}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Order lines summary */}
        <div style={styles.trackerLines}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>📦 Items Ordered</div>
          {order.lines?.map((line) => (
            <div key={line.id} style={styles.trackerLine}>
              <span>{line.product_name}</span>
              <span style={{ color: '#6b7280' }}>× {line.quantity}</span>
              <span style={{ fontWeight: 600 }}>₹{parseFloat(line.total).toFixed(0)}</span>
            </div>
          ))}
          <div
            style={{
              ...styles.trackerLine,
              fontWeight: 800,
              fontSize: 16,
              borderTop: '1px solid #e5e7eb',
              marginTop: 8,
              paddingTop: 8,
            }}
          >
            <span>Total</span>
            <span />
            <span style={{ color: '#4f46e5' }}>₹{parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>

        {status !== 'paid' && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              🔄 This page refreshes automatically every 10 seconds
            </div>
          </div>
        )}

        {status === 'paid' && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button style={styles.btnPrimary} onClick={onReorder}>
              Order Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SelfOrder() {
  const { token } = useParams();
  const cart = useCart();

  const [screen, setScreen] = useState('loading'); // loading | error | menu | tracking
  const [context, setContext] = useState(null); // { table, session, categories, products }
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pollRef = useRef(null);

  // Load menu context
  const loadContext = async () => {
    setScreen('loading');
    try {
      const res = await axios.get(`${BASE_URL}/self-order/table/${token}`);
      setContext(res.data.data);
      setScreen('menu');
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || 'Could not load menu. Please try again.'
      );
      setScreen('error');
    }
  };

  useEffect(() => {
    if (token) loadContext();
  }, [token]);

  // Poll order status every 10 seconds
  useEffect(() => {
    if (screen === 'tracking' && orderId) {
      const poll = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/self-order/order/${orderId}`);
          setOrderData(res.data.data);
        } catch {/* ignore */}
      };
      poll();
      pollRef.current = setInterval(poll, 10000);
    }
    return () => clearInterval(pollRef.current);
  }, [screen, orderId]);

  const placeOrder = async () => {
    if (cart.items.length === 0) return;
    setPlacing(true);
    try {
      const res = await axios.post(`${BASE_URL}/self-order/table/${token}/order`, {
        items: cart.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          note: i.note || undefined,
        })),
      });
      const { order_id } = res.data.data;
      cart.clear();
      setCartOpen(false);
      setOrderId(order_id);
      setScreen('tracking');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // Filtered products
  const products = context?.products || [];
  const filteredProducts = products.filter((p) => {
    const matchCat = !selectedCategory || p.category_id === selectedCategory;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  if (screen === 'loading') return <LoadingScreen />;
  if (screen === 'error')
    return <ErrorScreen message={errorMsg} onRetry={loadContext} />;

  if (screen === 'tracking') {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <div style={styles.headerBrand}>☕ POS Cafe</div>
          <div style={styles.headerSub}>Self-Order</div>
        </header>
        {!orderData ? (
          <LoadingScreen message="Loading your order status…" />
        ) : (
          <OrderTracker order={orderData} onReorder={() => setScreen('menu')} />
        )}
      </div>
    );
  }

  // Menu screen
  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.headerBrand}>☕ POS Cafe</div>
          <div style={styles.headerSub}>
            Table {context.table.table_number} · {context.table.floor_name}
          </div>
        </div>
        {/* Cart FAB */}
        {cart.totalItems > 0 && (
          <button style={styles.cartFab} onClick={() => setCartOpen(true)}>
            🛒
            <span style={styles.cartBadge}>{cart.totalItems}</span>
          </button>
        )}
      </header>

      {/* Search */}
      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          style={styles.searchInput}
          placeholder="Search dishes…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button style={styles.searchClear} onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* Category bar */}
      <CategoryBar
        categories={context.categories}
        selected={selectedCategory}
        onSelect={(id) => { setSelectedCategory(id); setSearchQuery(''); }}
      />

      {/* Product list */}
      <div style={styles.productList}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 40 }}>🍽️</div>
            <p style={{ marginTop: 12 }}>No items found</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const cartItem = cart.items.find((i) => i.product_id === product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                qty={cartItem?.quantity || 0}
                onAdd={cart.add}
                onRemove={cart.remove}
              />
            );
          })
        )}
      </div>

      {/* Bottom cart bar */}
      {cart.totalItems > 0 && (
        <div style={styles.bottomBar}>
          <button style={styles.bottomBtn} onClick={() => setCartOpen(true)}>
            <span style={styles.bottomBtnBadge}>{cart.totalItems}</span>
            View Cart
            <span>₹{cart.total.toFixed(0)} →</span>
          </button>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onPlaceOrder={placeOrder}
          placing={placing}
        />
      )}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: '#f9fafb',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    paddingBottom: 90,
  },
  centered: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  spinnerWrap: { position: 'relative', width: 56, height: 56 },
  spinnerRing: {
    width: 56,
    height: 56,
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },

  // Header
  header: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: '#fff',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 30,
    boxShadow: '0 2px 12px rgba(79,70,229,0.3)',
  },
  headerBrand: { fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' },
  headerSub: { fontSize: 12, opacity: 0.85, marginTop: 2 },

  cartFab: {
    background: 'rgba(255,255,255,0.2)',
    border: '1.5px solid rgba(255,255,255,0.4)',
    color: '#fff',
    borderRadius: 12,
    padding: '8px 12px',
    fontSize: 20,
    cursor: 'pointer',
    position: 'relative',
    backdropFilter: 'blur(8px)',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    background: '#ef4444',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: '50%',
    width: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    background: '#fff',
    border: '1px solid #e5e7eb',
    margin: '12px 14px 0',
    padding: '0 12px',
    gap: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  searchIcon: { fontSize: 16, userSelect: 'none' },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '11px 0',
    fontSize: 15,
    background: 'transparent',
    color: '#111827',
  },
  searchClear: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    fontSize: 14,
    padding: 4,
  },

  // Category bar
  catBar: {
    display: 'flex',
    overflowX: 'auto',
    gap: 4,
    padding: '10px 14px',
    scrollbarWidth: 'none',
    background: '#fff',
    borderBottom: '1px solid #f3f4f6',
  },
  catChip: {
    flexShrink: 0,
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: '#6b7280',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color 0.15s',
  },
  catChipActive: {
    color: '#4f46e5',
    fontWeight: 700,
    borderBottomColor: '#4f46e5',
  },

  // Product cards
  productList: { padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 },
  productCard: {
    background: '#fff',
    border: '1px solid #f3f4f6',
    display: 'flex',
    gap: 12,
    padding: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.15s',
  },
  productImg: {
    width: 72,
    height: 72,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 800,
    color: 'rgba(0,0,0,0.25)',
    borderRadius: 4,
  },
  productImgLetter: { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  productInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  productName: { fontWeight: 600, fontSize: 15, color: '#111827', lineHeight: 1.3 },
  productCat: { fontSize: 12, color: '#9ca3af' },
  productBottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 6,
  },
  productPrice: { fontWeight: 800, fontSize: 16, color: '#4f46e5' },
  addBtn: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    padding: '6px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    borderRadius: 4,
    transition: 'background 0.15s',
  },
  qtyControl: { display: 'flex', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 30,
    height: 30,
    background: '#f3f4f6',
    border: '1.5px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#374151',
  },
  qtyNum: { fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: 'center' },

  // Bottom cart bar
  bottomBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '10px 14px',
    background: 'rgba(249,250,251,0.95)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid #e5e7eb',
    zIndex: 20,
  },
  bottomBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: '#fff',
    border: 'none',
    padding: '14px 20px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
  },
  bottomBtnBadge: {
    background: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 13,
    marginRight: 4,
  },

  // Cart drawer
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 40,
    backdropFilter: 'blur(2px)',
  },
  drawer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 50,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
    animation: 'slideUp 0.25s ease',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 20px 14px',
    borderBottom: '1px solid #f3f4f6',
  },
  drawerClose: {
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '50%',
    width: 30,
    height: 30,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
    color: '#374151',
  },
  drawerBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  drawerFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #f3f4f6',
    background: '#fff',
  },
  cartRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 14,
    borderBottom: '1px solid #f9fafb',
  },
  noteInput: {
    marginTop: 6,
    width: '100%',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 12,
    color: '#374151',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#f9fafb',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    marginBottom: 4,
  },

  // Buttons
  btnPrimary: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: '#fff',
    border: 'none',
    padding: '12px 28px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    borderRadius: 8,
    boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
  },

  // Tracker
  trackerWrap: {
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  trackerCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  trackerOrderNum: {
    textAlign: 'center',
    marginBottom: 4,
  },
  trackerNumLabel: { fontSize: 12, color: '#9ca3af', display: 'block' },
  trackerNum: { fontSize: 28, fontWeight: 800, color: '#4f46e5', display: 'block' },
  trackerTable: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 28,
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    marginBottom: 28,
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  stepLine: {
    width: 2,
    height: 28,
    marginBottom: 0,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 14,
    color: '#fff',
    transition: 'all 0.3s',
    zIndex: 1,
  },
  stepLabel: {
    fontSize: 14,
    marginTop: 6,
  },
  stepDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 6,
  },
  trackerLines: {
    background: '#f9fafb',
    border: '1px solid #f3f4f6',
    borderRadius: 8,
    padding: '14px 16px',
  },
  trackerLine: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 14,
    paddingBottom: 6,
    marginBottom: 6,
  },
};
