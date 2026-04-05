import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { usePosStore } from '../../store/posStore';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

export default function PosPaymentScreen() {
  const { config_id, order_id } = useParams();
  const navigate = useNavigate();
  const { activePosConfig } = usePosStore();
  
  const [method, setMethod] = useState('');
  const [tenderedStr, setTenderedStr] = useState('0');
  const [pendingPayment, setPendingPayment] = useState(null);
  const [upiData, setUpiData] = useState(null);

  const { data: order } = useQuery({
    queryKey: ['order', order_id],
    queryFn: async () => {
      const res = await api.get(`/orders/${order_id}`);
      return res.data.data;
    }
  });

  const generateUpiMutation = useMutation({
    mutationFn: () => api.get(`/payments/upi-qr/${order_id}`),
    onSuccess: (res) => {
      setUpiData(res.data.data);
      setMethod('upi');
    }
  });

  const payMutation = useMutation({
    mutationFn: (data) => api.post('/payments', data),
    onSuccess: (res) => {
      setPendingPayment(res.data.data);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Payment intialization failed')
  });

  const validateMutation = useMutation({
    mutationFn: () => api.post(`/payments/${pendingPayment.id}/validate`),
    onSuccess: () => navigate(`/pos/${config_id}/confirmation`)
  });

  if (!order) return <div>Loading...</div>;

  const total = parseFloat(order.total);
  const tendered = parseFloat(tenderedStr);
  const change = tendered > total ? tendered - total : 0;
  const due = total > tendered ? total - tendered : 0;

  const handleNumpad = (val) => {
    if (val === 'C') setTenderedStr('0');
    else if (val === '+10') setTenderedStr((parseFloat(tenderedStr) + 10).toString());
    else if (val === '+50') setTenderedStr((parseFloat(tenderedStr) + 50).toString());
    else if (val === 'exact') setTenderedStr(total.toString());
    else if (tenderedStr === '0') setTenderedStr(val);
    else setTenderedStr(tenderedStr + val);
  };

  const handleInitPayment = () => {
    if (!method) return toast.error('Select method');
    if (method === 'cash' && tendered < total) return toast.error('Tendered amount less than due');
    payMutation.mutate({ order_id, method, amount: total });
  };

  return (
    <div className="pos-layout">
      {/* Left */}
      <div className="pos-left">
        <div className="pos-topbar">
          <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>← Back</Button>
          <div className="font-semibold" style={{ color: '#fff' }}>Payment - Order #{order.order_number}</div>
          <div style={{ width: 60 }}></div>
        </div>

        <div style={{ padding: 24 }}>
          <h2>Select Payment Method</h2>
          
          <div className="payment-methods mt-6">
            {activePosConfig?.enable_cash && (
              <div 
                className={`pay-method-btn ${method === 'cash' ? 'selected' : ''}`}
                onClick={() => { setMethod('cash'); setUpiData(null); }}
              >
                <div className="pm-icon">💵</div>
                <div className="pm-label">Cash</div>
              </div>
            )}
            {activePosConfig?.enable_digital && (
              <div 
                className={`pay-method-btn ${method === 'digital' ? 'selected' : ''}`}
                onClick={() => { setMethod('digital'); setUpiData(null); }}
              >
                <div className="pm-icon">💳</div>
                <div className="pm-label">Card/Digital</div>
              </div>
            )}
            {activePosConfig?.enable_upi && (
              <div 
                className={`pay-method-btn ${method === 'upi' ? 'selected' : ''}`}
                onClick={() => generateUpiMutation.mutate()}
              >
                <div className="pm-icon">📱</div>
                <div className="pm-label">UPI QR</div>
              </div>
            )}
          </div>

          <div className="card mt-6">
            <div className="flex-between mb-4">
              <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Total Due</span>
              <span className="font-bold" style={{ fontSize: 32 }}>₹{total.toFixed(2)}</span>
            </div>
            
            {method === 'cash' && (
              <>
                <div className="divider"></div>
                <div className="flex-between mb-2">
                  <span>Tendered</span>
                  <span className="font-semibold" style={{ fontSize: 24 }}>₹{tendered.toFixed(2)}</span>
                </div>
                <div className="flex-between text-success">
                  <span>Change Due</span>
                  <span className="font-bold" style={{ fontSize: 20 }}>₹{change.toFixed(2)}</span>
                </div>
              </>
            )}

            {method === 'upi' && upiData && (
              <div className="qr-screen">
                <img src={upiData.qr} alt="UPI QR View" />
                <h3 className="mt-4">Scan using any UPI App</h3>
                <p className="text-secondary">{upiData.upiId}</p>
              </div>
            )}
            {generateUpiMutation.isPending && (
              <div className="loading-center"><div className="spinner"></div></div>
            )}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="pos-right">
        {method === 'cash' ? (
          <div style={{ padding: 16 }}>
            <h3 className="mb-4">Numpad</h3>
            <div className="numpad">
              {['1','2','3','4','5','6','7','8','9','0','.','C'].map(k => (
                <button key={k} className="numpad-btn" onClick={() => handleNumpad(k)}>{k}</button>
              ))}
              <button className="numpad-btn" onClick={() => handleNumpad('exact')} style={{ gridColumn: 'span 3', background: 'var(--color-primary)', color: '#fff' }}>Exact</button>
              <button className="numpad-btn" onClick={() => handleNumpad('+10')} style={{ flex: 1 }}>+10</button>
              <button className="numpad-btn" onClick={() => handleNumpad('+50')} style={{ gridColumn: 'span 2' }}>+50</button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            {method ? "Ready to initialize payment" : "Select a payment method on the left"}
          </div>
        )}

        <div className="cart-footer">
          {pendingPayment ? (
            <Button size="lg" block variant="success" onClick={() => validateMutation.mutate()} loading={validateMutation.isPending}>
              Confirm Validation
            </Button>
          ) : (
            <Button size="lg" block variant="accent" onClick={handleInitPayment} disabled={!method || payMutation.isPending}>
              Initialize Payment
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
