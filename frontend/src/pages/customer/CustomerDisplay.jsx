import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { socket, connectSocket } from '../../socket';
import { Html5Qrcode } from 'html5-qrcode';
import toast, { Toaster } from 'react-hot-toast';
import { Button } from '../../components/Button';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Category emoji map
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

export default function CustomerDisplay() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentMsg, setPaymentMsg] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Table selection state
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [qrModal, setQrModal] = useState(false);

  const menuRef = useRef(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Initial Fetch & Real-Time Setup
  useEffect(() => {
    if (!socket.connected) connectSocket();

    const fetchProducts = () => {
      axios.get(`${BASE}/products/public/menu`).then(r => setProducts(r.data.data || []));
      axios.get(`${BASE}/products/public/categories`).then(r => setCategories(r.data.data || []));
    };

    fetchProducts();
    
    // Fetch floors/tables
    axios.get(`${BASE}/public/floors`).then(r => setFloors(r.data.data || []));
    axios.get(`${BASE}/public/tables`).then(r => setTables(r.data.data || []));

    socket.on('products_updated', fetchProducts);

    return () => {
      socket.off('products_updated', fetchProducts);
    };
  }, []);

  // Scanner Logic
  useEffect(() => {
    let html5QrCode;
    let isStarted = false;

    if (qrModal) {
      html5QrCode = new Html5Qrcode("reader");
      
      const onScanSuccess = (decodedText) => {
        try {
          const urlParts = decodedText.split('/table/');
          const tableId = urlParts.length > 1 ? urlParts[1] : decodedText; // Parse URL or Raw ID
          
          if (tableId) {
            const table = tables.find(t => t.id === tableId);
            if (table) {
              setSelectedTable(table.id);
              setSelectedFloor(table.floor_id);
              toast.success(`Success! Seated at Table ${table.table_number}`, { icon: '🍽️' });
              setQrModal(false);
            } else {
               toast.error("Unknown table QR code");
            }
          }
        } catch (e) {
          toast.error("Invalid QR format");
        }
      };

      // Ensure slight delay for DOM to render the container
      setTimeout(() => {
        html5QrCode.start(
          { facingMode: "environment" }, 
          { fps: 10, qrbox: { width: 250, height: 250 } }, 
          onScanSuccess
        )
        .then(() => { isStarted = true; })
        .catch(err => {
          console.error("Camera Error:", err);
          toast.error("Please grant camera permissions", { duration: 4000 });
        });
      }, 100);
    }

    return () => {
      if (html5QrCode && isStarted) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [qrModal, tables]);

  // Socket
  useEffect(() => {
    connectSocket();
    socket.on('order_paid', (data) => {
      setPaymentMsg(`✅ Payment of ₹${Number(data.amount).toFixed(2)} received!`);
      setCart([]);
      setCheckoutModal(false);
      setTimeout(() => setPaymentMsg(null), 6000);
    });
    return () => socket.off('order_paid');
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`Added ${product.name}`, { duration: 1000, icon: '🛒' });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const placeOrder = async () => {
    if (!cart.length) return;
    if (!selectedTable) return toast.error('Please select your table first.');
    
    setIsOrdering(true);
    try {
      const res = await axios.post(`${BASE}/public/orders`, {
        table_id: selectedTable,
        customer_name: 'Kiosk Customer',
        payment_method: paymentMethod || 'counter',
        notes: orderNotes,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      });
      
      setPlacedOrder(res.data.data);
      setCart([]);
      setCheckoutModal(false);
      toast.success('Order placed! Redirecting to payment...', { icon: '🔥' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally {
      setIsOrdering(false);
    }
  };

  const filtered = activeCategory
    ? products.filter(p => p.category_id === activeCategory)
    : products;

  const featured = products.slice(0, 6);

  const formatTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="cd2-root">
      <Toaster position="top-right" />
      
      {/* ── HEADER ───────────────────────────────────────── */}
      <header className="cd2-header">
        <div className="cd2-branding">
          <span className="cd2-logo-icon">☕</span>
          <div>
            <h1 className="cd2-title">Cawfee Tawk</h1>
            <p className="cd2-tagline">Self-Service Terminal</p>
          </div>
        </div>
        <div className="cd2-clock">
          <div className="cd2-time">{formatTime(currentTime)}</div>
          <div className="cd2-date">{formatDate(currentTime)}</div>
        </div>
      </header>

      {/* ── BODY ─────────────────────────────────────────── */}
      <div className="cd2-body">

        {/* ══ LEFT: MENU ══════════════════════════════════ */}
        <section className="cd2-menu-panel">
          <div className="cd2-section-title" style={{ justifyContent: 'space-between', paddingRight: '16px' }}>
            <div><span className="cd2-section-icon">📋</span> Tap Item to Add</div>
            <button 
              className="pos2-action-btn pos2-pay-btn" 
              style={{ width: 'auto', padding: '6px 14px', fontSize: 11, borderRadius: 20 }}
              onClick={() => setQrModal(true)}
            >
              📷 Scan QR
            </button>
          </div>

          <div className="cd2-cat-bar">
            {categories.map(c => (
              <button
                key={c.id}
                className={`cd2-cat-pill ${activeCategory === c.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(c.id)}
              >
                {getEmoji(c.name)} {c.name}
              </button>
            ))}
          </div>

          <div className="cd2-menu-scroll" ref={menuRef}>
            {/* ── INTERACTIVE SLIDESHOW & TRENDING (Mobile / Desktop) ── */}
            {(!activeCategory || activeCategory === 'all') && (
              <div className="cd2-interactive-blocks animate-fade-in" style={{ marginBottom: 24, padding: '0 8px' }}>
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                  <div className="cd2-slide-card" style={{ background: 'linear-gradient(135deg, #1A6C9B, #0E4160)', color: 'white', minWidth: '300px', borderRadius: 16, padding: 24, flex: '0 0 auto', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                       <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 12, fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Trending Now</span>
                       <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginTop: 12 }}>Peri-Peri Momos</h3>
                       <p style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>Bestseller of the week!</p>
                    </div>
                    <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 100, opacity: 0.2 }}>🥟</div>
                  </div>
                  <div className="cd2-slide-card" style={{ background: 'linear-gradient(135deg, #C02929, #8C1C1C)', color: 'white', minWidth: '300px', borderRadius: 16, padding: 24, flex: '0 0 auto', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                       <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 12, fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>Happy Hour</span>
                       <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginTop: 12 }}>Cold Coffee</h3>
                       <p style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>Buy 1 Get 1 on Hazelnut.</p>
                    </div>
                    <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 100, opacity: 0.2 }}>☕</div>
                  </div>
                </div>
                
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginTop: 24, marginBottom: 16, borderBottom: '2px solid var(--border-dark)', paddingBottom: 8, color: 'var(--cafe-espresso)' }}>
                  Our Favorites
                </h4>
              </div>
            )}

            <div className="cd2-prod-grid">
               {filtered.map(p => <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />)}
            </div>
          </div>
        </section>

        {/* ══ RIGHT: KIOSK CART ═════════════════════════════ */}
        <aside className="cd2-order-panel">
          {placedOrder ? (
            <div className="cd2-order-card animate-scale-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', textAlign: 'center', padding: '40px 20px' }}>
               <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
               <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--cafe-espresso)' }}>Order Placed!</h2>
               <p className="mt-2 text-lg">Order #{placedOrder.order_number || (placedOrder.id && placedOrder.id.toString().substring(0,6))}</p>
               
               <div className="card mt-8" style={{ background: '#fff', padding: 24, borderRadius: 16 }}>
                  <h3 className="mb-4">Grand Total: ₹{placedOrder.total}</h3>
                  {paymentMethod === 'upi' ? (
                    <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=cawfeepos@bank&pn=CawfeeTawk&am=${placedOrder.total}&cu=INR`} 
                        alt="Payment QR"
                        style={{ margin: '0 auto', borderRadius: 8 }}
                      />
                      <p className="mt-4 text-sm font-semibold">Scan to Pay via UPI</p>
                    </div>
                  ) : (
                    <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                      <h3 style={{ margin: '10px 0' }}>💵 Cash Pending</h3>
                      <p className="mt-2 text-sm">Please pay at the counter so we can process your order physically.</p>
                    </div>
                  )}
                  <Button 
                    block 
                    variant="primary" 
                    onClick={() => { 
                      setPlacedOrder(null); 
                      setPaymentMethod(null); 
                      setOrderNotes('');
                      setCart([]);
                    }}
                  >
                    Start New Order
                  </Button>
               </div>
            </div>
          ) : (
            <>
              <div className="cd2-section-title">
                <span className="cd2-section-icon">🛒</span> Your Order
              </div>

              {paymentMsg && (
                <div className="cd2-payment-success">
                  <div className="cd2-payment-icon">🎉</div>
                  <div className="cd2-payment-text">{paymentMsg}</div>
                  <div className="cd2-payment-sub">Processing your fresh brew!</div>
                </div>
              )}

              {!paymentMsg && (
                <div className="cd2-order-card">
                  <div className="cd2-order-header">
                    <div>
                      {selectedTable ? `Table: ${tables.find(t=>t.id===selectedTable)?.table_number}` : 'No Table Selected'}
                    </div>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--cafe-caramel)', cursor: 'pointer', fontSize: 11 }}
                      onClick={() => setCheckoutModal(true)}
                    >
                      Change Table
                    </button>
                  </div>

                  <div className="cd2-order-lines">
                    {cart.length ? cart.map(l => (
                      <div key={l.id} className="cd2-order-line">
                        <div className="cd2-line-qty" onClick={() => updateQty(l.id, -1)} style={{ cursor: 'pointer' }}>
                          {l.quantity}×
                        </div>
                        <div className="cd2-line-info">
                          <div className="cd2-line-name">{l.name}</div>
                        </div>
                        <div className="cd2-line-price">₹{(parseFloat(l.price) * l.quantity).toFixed(0)}</div>
                        <button className="pos2-qty-btn" style={{ marginLeft: 8 }} onClick={() => updateQty(l.id, 1)}>+</button>
                      </div>
                    )) : (
                      <div className="cd2-order-empty">
                        <span>🛍️</span>
                        <p>Tray is empty<br />Tap items to select</p>
                      </div>
                    )}
                  </div>

                  <div className="cd2-order-totals">
                    <div className="cd2-total-row cd2-grand-total">
                      <span>Grand Total</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    
                    {cart.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <textarea
                          placeholder="📝 Add special instructions (e.g. Extra spicy, No sugar)"
                          value={orderNotes}
                          onChange={e => setOrderNotes(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dark)', marginBottom: '16px', background: '#fff', fontSize: '13px', resize: 'vertical' }}
                          rows={2}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            className="pos2-action-btn pos2-pay-btn" 
                            style={{ flex: 1, padding: '12px', fontSize: '14px', background: 'var(--cafe-caramel)' }}
                            onClick={() => { setPaymentMethod('counter'); placeOrder(); }}
                            disabled={isOrdering}
                          >
                            💵 Pay at Counter
                          </button>
                          <button 
                            className="pos2-action-btn pos2-pay-btn" 
                            style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                            onClick={() => { setPaymentMethod('upi'); placeOrder(); }}
                            disabled={isOrdering}
                          >
                            📱 Pay via UPI
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div 
                className="cd2-promo" 
                style={{ opacity: 0.9, cursor: 'pointer', border: '1px solid var(--cafe-caramel)', background: 'rgba(200,129,58,0.15)' }} 
                onClick={() => setQrModal(true)}
              >
                <div className="cd2-promo-icon">📷</div>
                <div>
                  <div className="cd2-promo-title" style={{ textDecoration: 'underline' }}>Scan Table QR</div>
                  <div className="cd2-promo-sub">Click here to scan the code on your table!</div>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ── QR SCANNER MODAL ──────────────────────────── */}
      {qrModal && (
        <div className="modal-overlay">
          <div className="modal animate-scale-in" style={{ padding: 24, borderRadius: 16 }}>
            <div className="flex-between mb-4">
              <h2 style={{ fontFamily: 'var(--font-display)' }}>Scan Table QR</h2>
              <button onClick={() => setQrModal(false)} className="pos2-qty-btn">×</button>
            </div>
            <div id="reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}></div>
            <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-secondary)' }}>
              Point your camera at the QR code on your table.
            </p>
          </div>
        </div>
      )}

      {/* ── MANUAL TABLE SELECTION ────────────────────────── */}
      {checkoutModal && (
        <div className="modal-overlay">
          <div className="modal animate-scale-in" style={{ padding: 24, borderRadius: 16 }}>
            <div className="flex-between mb-4">
              <h2 style={{ fontFamily: 'var(--font-display)' }}>Select your Floor & Table</h2>
              <button onClick={() => setCheckoutModal(false)} className="pos2-qty-btn">×</button>
            </div>

            <div className="form-grid" style={{ marginBottom: 24 }}>
              <div className="input-group">
                <label>Floor</label>
                <select 
                  className="input-field"
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  value={selectedFloor || ''}
                >
                  <option value="">Select Floor...</option>
                  {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Table</label>
                <select 
                  className="input-field"
                  onChange={(e) => setSelectedTable(e.target.value)}
                  value={selectedTable || ''}
                  disabled={!selectedFloor}
                >
                  <option value="">Select Table...</option>
                  {tables.filter(t => t.floor_id === selectedFloor).map(t => (
                    <option key={t.id} value={t.id}>Table {t.table_number}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              className="pos2-action-btn pos2-pay-btn" 
              onClick={() => setCheckoutModal(false)}
              disabled={!selectedTable}
            >
               Confirm Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const MOCK_FOODS = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80',
  'https://images.unsplash.com/photo-1484723091791-caff3228fe1f?w=400&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  'https://images.unsplash.com/photo-1481070555726-e2fe83477d15?w=400&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'
];

function ProductCard({ product, onAdd }) {
  // Use image_url from DB directly, or compute a deterministic fallback
  const imageUrl = product.image_url || (() => {
    const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return MOCK_FOODS[hash % MOCK_FOODS.length];
  })();

  const emoji = getEmoji(product.name + ' ' + (product.category_name || ''));
  return (
    <div 
      className="cd2-prod-card animate-scale-in" 
      onClick={onAdd}
      style={{ cursor: 'pointer', padding: imageUrl ? '0px' : '20px' }}
    >
      {imageUrl ? (
        <div style={{ width: '100%', height: '140px', background: 'var(--border-dark)', overflow: 'hidden' }}>
          <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div className="cd2-prod-emoji">{emoji}</div>
      )}
      
      <div style={{ padding: imageUrl ? '12px' : '0px', textAlign: imageUrl ? 'left' : 'center', width: '100%' }}>
        <div className="cd2-prod-name" style={{ fontSize: imageUrl ? 14 : 15 }}>{product.name}</div>
        <div className="cd2-prod-price" style={{ marginTop: 4 }}>₹{parseFloat(product.price).toFixed(0)}</div>
        <div className="pos2-add-hint" style={{ opacity: 1, marginTop: 8 }}>+ Add</div>
      </div>
    </div>
  );
}
