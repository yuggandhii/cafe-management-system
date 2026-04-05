import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { socket, connectSocket, disconnectSocket } from '../../socket';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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

export default function TableOrderScreen() {
  const { table_id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  
  const [cart, setCart] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [upiData, setUpiData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableNumber, setTableNumber] = useState('...');
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mockRating, setMockRating] = useState('4.8');
  const [modalQty, setModalQty] = useState(1);

  // Fetch public menu and table info
  useEffect(() => {
    axios.get(`${BASE}/products/public/categories`).then(r => setCategories(r.data.data || []));
    axios.get(`${BASE}/products/public/menu`).then(r => setProducts(r.data.data || []));
    
    axios.get(`${BASE}/public/tables/${table_id}`)
      .then(r => setTableNumber(r.data.data.table_number))
      .catch(() => setTableNumber(table_id.substring(0, 4)));
      
    connectSocket();
    return () => disconnectSocket();
  }, [table_id]);

  // Real-time socket mockup for ratings
  useEffect(() => {
    if (selectedProduct) {
      setMockRating((Math.random() * (5.0 - 4.2) + 4.2).toFixed(1)); // Initial random rating
      const handleRatingUpdate = (data) => {
        if (data.product_id === selectedProduct.id) {
          setMockRating(data.rating.toFixed(1));
        }
      };
      
      socket.on('product_rating_update', handleRatingUpdate);
      
      // Simulate socket events firing randomly
      const interval = setInterval(() => {
        const fakeRating = (Math.random() * (5.0 - 4.2) + 4.2);
        socket.emit('simulate_rating', { product_id: selectedProduct.id, rating: fakeRating });
        setMockRating(fakeRating.toFixed(1)); // fallback local update for demo
      }, 5000);
      
      return () => {
        socket.off('product_rating_update', handleRatingUpdate);
        clearInterval(interval);
      };
    }
  }, [selectedProduct]);

  const handleProductTap = (product) => {
    setSelectedProduct(product);
    setModalQty(1);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    setCart(prev => {
      const existing = prev.find(i => i.product_id === selectedProduct.id);
      if (existing) {
        return prev.map(i => i.product_id === selectedProduct.id ? { ...i, quantity: i.quantity + modalQty } : i);
      }
      return [...prev, { product_id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, quantity: modalQty }];
    });
    if (navigator.vibrate) navigator.vibrate(50);
    setSelectedProduct(null);
  };

  const removeFromCart = (product_id) => {
    setCart(prev => prev.filter(i => i.product_id !== product_id));
  };

  const submitOrder = async () => {
    if (!cart.length) return toast.error('Cart is empty');
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${BASE}/public/orders`, {
        table_id,
        notes: orderNotes,
        items: cart
      });
      setPlacedOrder(res.data.data);
      setCart([]);
      toast.success('Order sent to kitchen!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place order. Kitchen might be offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateUpi = async () => {
    setPaymentMethod('upi');
    try {
      setUpiData({
        qr: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=cawfeepos@bank&pn=CawfeeTawk&am=${placedOrder.total}&cu=INR`,
        upiId: 'cawfeepos@bank'
      });
    } catch (e) {}
  };

  const filteredProducts = activeCategory ? products.filter(p => p.category_id === activeCategory) : products;
  const total = cart.reduce((s, i) => s + (parseFloat(i.price) * i.quantity), 0);

  if (placedOrder) {
    return (
      <div className="pos-layout colorful-customer-ui" style={{ display: 'block', padding: 24, paddingBottom: 100 }}>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <h1 style={{ fontSize: 32, fontFamily: 'var(--font-display)' }}>Order #{placedOrder.order_number || (placedOrder.id && placedOrder.id.toString().substring(0,6))} Placed!</h1>
          <p className="mt-2 text-xl">Your food is being prepared in the kitchen.</p>
          
          <div className="card mt-8 max-w-md mx-auto" style={{ textAlign: 'left', borderRadius: '16px' }}>
            <h3 className="mb-4">Payment Pending: ₹{placedOrder.total}</h3>
            
            {!paymentMethod ? (
              <div className="flex gap-4 flex-col">
                <Button size="lg" block variant="accent" onClick={generateUpi}>Pay via UPI (PhonePe, GPay, Paytm)</Button>
                <Button size="lg" block variant="outline" onClick={() => setPaymentMethod('cash')}>Pay Cash at Counter</Button>
              </div>
            ) : paymentMethod === 'upi' ? (
               <div style={{ textAlign: 'center' }}>
                 {upiData ? (
                   <>
                     <img src={upiData.qr} alt="UPI" style={{ margin: '0 auto', borderRadius: 10 }} />
                     <p className="mt-4">Scan using any UPI App</p>
                   </>
                 ) : <div className="spinner mx-auto mt-4"></div>}
               </div>
            ) : (
               <div style={{ textAlign: 'center' }}>
                 <p className="text-xl">Please pay the cashier before leaving.</p>
               </div>
            )}
            
            <div className="mt-8 pt-4" style={{ borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
              <Button variant="ghost" onClick={() => { setPlacedOrder(null); setPaymentMethod(null); setCart([]); }}>Order More Items</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-layout colorful-customer-ui">
      {/* ══ LEFT: MENU ═══════════════════════════════════════════════════ */}
      <div className="pos2-left">
        <div className="pos2-topbar">
          <div className="pos2-topbar-center" style={{ marginLeft: 0 }}>
            <span className="pos2-topbar-logo">☕</span>
            <span className="pos2-topbar-name" style={{ marginLeft: '8px' }}>Odoo Cafe - Self Order</span>
            <span className="pos2-table-badge" style={{ marginLeft: '16px' }}>Table {tableNumber}</span>
          </div>
        </div>

        <div className="pos2-cat-bar">
          <button className={`pos2-cat-pill ${!activeCategory ? 'active' : ''}`} onClick={() => setActiveCategory(null)}>All</button>
          {categories.map(c => (
            <button key={c.id} className={`pos2-cat-pill ${activeCategory === c.id ? 'active' : ''}`} onClick={() => setActiveCategory(c.id)}>
              {getEmoji(c.name)} {c.name}
            </button>
          ))}
        </div>

        <div className="pos2-product-scroll">
          <div className="pos2-product-grid">
            {filteredProducts.map(p => {
              const inCart = cart.find(i => i.product_id === p.id);
              return (
                <div key={p.id} className={`pos2-prod-card animate-scale-in ${inCart ? 'in-cart' : ''}`} onClick={() => handleProductTap(p)}>
                  {inCart && <div className="pos2-in-cart-badge">{inCart.quantity}</div>}
                  <div className="pos2-prod-emoji">{getEmoji(p.name)}</div>
                  <div className="pos2-prod-name">{p.name}</div>
                  <div className="pos2-prod-price">₹{parseFloat(p.price).toFixed(0)}</div>
                  <div className="pos2-add-hint">+ View Details</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ RIGHT: CART ══════════════════════════════════════════════════ */}
      <div className="pos2-right">
        <div className="pos2-cart-header">
           <div className="pos2-cart-title" style={{color: '#444'}}>Your Tray</div>
           <div className="pos2-cart-sub" style={{color: '#E65A28', fontWeight: 'bold'}}>Table {tableNumber}</div>
        </div>

        <div className="pos2-cart-lines">
          {cart.map(l => (
            <div key={l.product_id} className="pos2-cart-item animate-fade-in">
              <div className="pos2-ci-emoji">{getEmoji(l.name)}</div>
              <div className="pos2-ci-info">
                <div className="pos2-ci-name" style={{color: '#333'}}>{l.name}</div>
                <div className="pos2-ci-details text-xs" style={{color: '#E65A28', fontWeight: 'bold'}}>₹{parseFloat(l.price).toFixed(2)}</div>
              </div>
              <div className="flex gap-2 items-center">
                 <div className="font-bold text-gray-800">x{l.quantity}</div>
                 <button className="btn btn-sm btn-danger ml-2" style={{borderRadius: '12px'}} onClick={(e) => { e.stopPropagation(); removeFromCart(l.product_id); }}>X</button>
              </div>
            </div>
          ))}
          {!cart.length && (
            <div style={{ textAlign: 'center', marginTop: 40, opacity: 0.5 }}>
              Tap products to add them to your tray.
            </div>
          )}
        </div>

        <div className="pos2-cart-footer">
          <div className="pos2-cf-row grand-total" style={{color: '#333'}}>
            <span>Estimated Total </span>
            <span style={{color: '#E65A28'}}>₹{total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-center mt-2 opacity-70 mb-4" style={{color: '#666'}}>*Taxes calculated at checkout</p>
          <div style={{ padding: '0 10px 10px 10px' }}>
            {cart.length > 0 && (
              <textarea
                placeholder="📝 Add special instructions (e.g. Extra spicy, No sugar)"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-dark)', marginBottom: '16px', background: '#fff', fontSize: '13px', resize: 'vertical' }}
                rows={2}
              />
            )}
            <Button size="lg" block variant="primary" 
                    onClick={submitOrder} 
                    disabled={!cart.length || isSubmitting} 
                    loading={isSubmitting}>
              Place Order
            </Button>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedProduct(null)} 
          title="Product Details"
        >
          <div className="p-4 text-center">
            <div style={{fontSize: '64px', margin: '0 auto'}}>{getEmoji(selectedProduct.name)}</div>
            <h2 className="text-2xl font-bold mt-2" style={{color: '#333'}}>{selectedProduct.name}</h2>
            <div className="text-xl font-semibold mt-1" style={{color: '#E65A28'}}>₹{parseFloat(selectedProduct.price).toFixed(2)}</div>
            
            <div className="flex gap-4 justify-center items-center mt-4 bg-gray-50 p-4 rounded-xl">
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Live Rating</span>
                <span className="text-2xl font-bold" style={{color: '#2A8B46'}}>★ {mockRating} / 5</span>
              </div>
            </div>
            
            <div className="mt-6 text-left">
              <h4 className="font-bold text-sm text-gray-500 uppercase mb-2">Ingredients</h4>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Premium Origin Blend</li>
                <li>Organic Milk options</li>
                <li>Artisanal Flavouring</li>
                <li>Crafted with Love</li>
              </ul>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-4 bg-white border border-gray-300 rounded-full px-2 py-1">
              <button 
                className="w-8 h-8 flex items-center justify-center font-bold text-lg rounded-full disabled:opacity-50 text-gray-600"
                onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                disabled={modalQty <= 1}
              >-</button>
              <span className="font-bold w-4 text-center">{modalQty}</span>
              <button 
                className="w-8 h-8 flex items-center justify-center font-bold text-lg rounded-full text-gray-600"
                onClick={() => setModalQty(modalQty + 1)}
              >+</button>
            </div>
            <Button size="lg" variant="primary" onClick={confirmAddToCart} className="flex-1 ml-4 shadow-lg shadow-orange-500/30">
              Add to Tray • ₹{(selectedProduct.price * modalQty).toFixed(2)}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
