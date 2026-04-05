import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import api from '../../api/axios';

const NUM_PAD = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '⌫'];

export default function PaymentScreen() {
  const { config_id, order_id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [method, setMethod] = useState(null);
  const [cashInput, setCashInput] = useState('');
  const [upiModal, setUpiModal] = useState(false);
  const [upiData, setUpiData] = useState(null);

  const { data: order } = useQuery({
    queryKey: ['order', order_id],
    queryFn: () => api.get(`/orders/${order_id}`).then((r) => r.data.data),
  });

  const { data: posConfig } = useQuery({
    queryKey: ['pos-config', config_id],
    queryFn: () => api.get(`/pos-configs/${config_id}`).then((r) => r.data.data),
  });

  const process = useMutation({
    mutationFn: (data) => api.post('/payments/process', data),
    onSuccess: () => {
      toast.success('Payment confirmed!');
      navigate(`/pos/${config_id}/confirmation`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Payment failed'),
  });

  const handleNumpad = (key) => {
    if (key === '⌫') {
      setCashInput((p) => p.slice(0, -1));
    } else {
      setCashInput((p) => p + key);
    }
  };

  const handlePay = async () => {
    if (!method) return toast.error('Select payment method');

    if (method === 'upi') {
      try {
        const res = await api.get(`/payments/upi-qr/${order_id}`);
        setUpiData(res.data.data);
        setUpiModal(true);
      } catch {
        toast.error('UPI not configured');
      }
      return;
    }

    const amount = method === 'cash'
      ? parseFloat(cashInput) || parseFloat(order?.total)
      : parseFloat(order?.total);

    process.mutate({ order_id, method, amount });
  };

  const confirmUpiPayment = () => {
    process.mutate({ order_id, method: 'upi', amount: parseFloat(order?.total) });
    setUpiModal(false);
  };

  if (!order) return <div className="loading-center"><div className="spinner" /></div>;

  const change = method === 'cash' && cashInput
    ? (parseFloat(cashInput) - parseFloat(order.total)).toFixed(2)
    : null;

  const methods = [
    { key: 'cash', label: '💵 Cash', enabled: posConfig?.enable_cash },
    { key: 'digital', label: '💳 Card / Digital', enabled: posConfig?.enable_digital },
    { key: 'upi', label: '📱 UPI', enabled: posConfig?.enable_upi },
  ].filter((m) => m.enabled);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      {/* Order summary */}
      <div style={{ width: 300, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 15 }}>
          📋 {order.order_number}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {order.lines?.map((line) => (
            <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span>{line.product_name} × {line.quantity}</span>
              <span>₹{parseFloat(line.total).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span>Subtotal</span><span>₹{parseFloat(order.subtotal).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span>Tax</span><span>₹{parseFloat(order.tax_amount).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, borderTop: '2px solid var(--text)', paddingTop: 8 }}>
            <span>TOTAL</span><span>₹{parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Select Payment Method</h2>
        </div>

        {/* Payment methods */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {methods.map((m) => (
            <button
              key={m.key}
              className={`btn ${method === m.key ? 'btn-primary' : 'btn-secondary'} btn-lg`}
              style={{ flex: 1, padding: '20px', fontSize: 16 }}
              onClick={() => setMethod(m.key)}
            >
              {m.label}
            </button>
          ))}
          {methods.length === 0 && (
            <p style={{ color: 'var(--text-3)' }}>No payment methods enabled. Configure them in Backend → POS Config Settings.</p>
          )}
        </div>

        {/* Cash numpad */}
        {method === 'cash' && (
          <div style={{ maxWidth: 280 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 16px', fontSize: 24, fontWeight: 700, textAlign: 'right', marginBottom: 2 }}>
              {cashInput || '0'}
            </div>
            <div className="numpad">
              {NUM_PAD.map((key) => (
                <button key={key} className="numpad-key" onClick={() => handleNumpad(key)}>{key}</button>
              ))}
            </div>
            {change !== null && (
              <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>Change</span>
                <strong style={{ color: parseFloat(change) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  ₹{change}
                </strong>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
          <button
            className="btn btn-success btn-lg"
            style={{ flex: 1 }}
            onClick={handlePay}
            disabled={!method || process.isPending}
          >
            {process.isPending ? 'Processing...' : `✓ Confirm Payment — ₹${parseFloat(order.total).toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* UPI QR Modal */}
      <Modal isOpen={upiModal} onClose={() => setUpiModal(false)} title="Scan UPI QR Code"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setUpiModal(false)}>Cancel</button>
            <button className="btn btn-success" onClick={confirmUpiPayment}>Payment Received ✓</button>
          </>
        }
      >
        <div style={{ textAlign: 'center' }}>
          {upiData?.qr && <img src={upiData.qr} alt="UPI QR" style={{ width: 250, height: 250 }} />}
          <p style={{ marginTop: 12, fontSize: 14 }}>UPI ID: <strong>{upiData?.upi_id}</strong></p>
          <p style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>₹{upiData?.amount}</p>
          <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>Ask customer to scan and pay, then click "Payment Received"</p>
        </div>
      </Modal>
    </div>
  );
}
