const db = require('../../db');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

// Payments are fully simulated - no real payment gateway
const createPayment = async ({ order_id, method, amount }) => {
  const order = await db('orders').where({ id: order_id }).first();
  if (!order) { const e = new Error('Order not found'); e.statusCode = 404; throw e; }
  if (order.status === 'paid') { const e = new Error('Order already paid'); e.statusCode = 400; throw e; }

  // Check if method is enabled in pos_config (via session)
  const session = await db('sessions').where({ id: order.session_id }).first();
  const config = await db('pos_configs').where({ id: session.pos_config_id }).first();
  if (method === 'cash' && !config.enable_cash) { const e = new Error('Cash payments are disabled'); e.statusCode = 400; throw e; }
  if (method === 'digital' && !config.enable_digital) { const e = new Error('Digital payments are disabled'); e.statusCode = 400; throw e; }
  if (method === 'upi' && !config.enable_upi) { const e = new Error('UPI payments are disabled'); e.statusCode = 400; throw e; }

  // Delete any pending payments for this order first
  await db('payments').where({ order_id, status: 'pending' }).del();

  const [payment] = await db('payments').insert({
    id: uuidv4(), order_id, method, amount, status: 'pending',
    reference: `REF-${Date.now()}`,
  }).returning('*');
  return payment;
};

const validatePayment = async (payment_id, io) => {
  const payment = await db('payments').where({ id: payment_id }).first();
  if (!payment) { const e = new Error('Payment not found'); e.statusCode = 404; throw e; }

  // Simulate payment confirmation (fake - always succeeds)
  const [confirmed] = await db('payments').where({ id: payment_id }).update({ status: 'confirmed' }).returning('*');

  // Mark order as paid
  const [order] = await db('orders').where({ id: payment.order_id }).update({ status: 'paid' }).returning('*');

  // Update customer total_sales if set
  if (order.customer_id) {
    await db('customers').where({ id: order.customer_id })
      .increment('total_sales', parseFloat(payment.amount));
  }

  // Emit socket event for customer display
  if (io) {
    io.emit('order_paid', { order_id: payment.order_id, amount: payment.amount, method: payment.method });
  }

  return { payment: confirmed, order };
};

// Generate fake UPI QR code (no real API, just encodes a UPI string)
const generateUpiQr = async (order_id) => {
  const order = await db('orders').where({ id: order_id }).first();
  if (!order) { const e = new Error('Order not found'); e.statusCode = 404; throw e; }
  const session = await db('sessions').where({ id: order.session_id }).first();
  const config = await db('pos_configs').where({ id: session.pos_config_id }).first();

  const upiId = config.upi_id || '123@ybl';
  const amount = parseFloat(order.total).toFixed(2);
  // Standard UPI deep link format
  const upiString = `upi://pay?pa=${upiId}&pn=Cawfee+Tawk&am=${amount}&cu=INR&tn=Order+${order.order_number}`;

  const qrBase64 = await QRCode.toDataURL(upiString, { width: 250, margin: 1 });
  return { qr: qrBase64, amount, upiId, upiString };
};

const listPayments = async ({ method, date_from, date_to, session_id } = {}) => {
  let q = db('payments as p')
    .join('orders as o', 'p.order_id', 'o.id')
    .select('p.*', 'o.order_number', 'o.session_id')
    .where('p.status', 'confirmed')
    .orderBy('p.created_at', 'desc');
  if (method) q = q.where('p.method', method);
  if (session_id) q = q.where('o.session_id', session_id);
  if (date_from) q = q.where('p.created_at', '>=', date_from);
  if (date_to) q = q.where('p.created_at', '<=', date_to);
  return q;
};

module.exports = { createPayment, validatePayment, generateUpiQr, listPayments };
