const db = require('../../db');
const QRCode = require('qrcode');

const createPayment = async ({ order_id, method, amount }) => {
  const order = await db('orders')
    .select('orders.*', 'pos_configs.enable_cash', 'pos_configs.enable_digital', 'pos_configs.enable_upi')
    .leftJoin('sessions', 'orders.session_id', 'sessions.id')
    .leftJoin('pos_configs', 'sessions.pos_config_id', 'pos_configs.id')
    .where('orders.id', order_id)
    .first();

  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  if (order.status === 'paid') {
    const err = new Error('Order is already paid');
    err.statusCode = 400;
    throw err;
  }

  if (order.lines && order.lines.length === 0) {
    const err = new Error('Order has no items');
    err.statusCode = 400;
    throw err;
  }

  // Check method enabled
  if (method === 'cash' && !order.enable_cash) {
    const err = new Error('Cash payment is not enabled');
    err.statusCode = 400;
    throw err;
  }
  if (method === 'digital' && !order.enable_digital) {
    const err = new Error('Digital payment is not enabled');
    err.statusCode = 400;
    throw err;
  }
  if (method === 'upi' && !order.enable_upi) {
    const err = new Error('UPI payment is not enabled');
    err.statusCode = 400;
    throw err;
  }

  // Validate amount matches total
  if (parseFloat(amount) !== parseFloat(order.total)) {
    const err = new Error(`Payment amount ₹${amount} does not match order total ₹${order.total}`);
    err.statusCode = 400;
    throw err;
  }

  const [payment] = await db('payments')
    .insert({ order_id, method, amount, status: 'pending' })
    .returning('*');

  return payment;
};

const validatePayment = async (payment_id) => {
  const payment = await db('payments').where({ id: payment_id }).first();
  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }

  if (payment.status === 'confirmed') {
    const err = new Error('Payment already confirmed');
    err.statusCode = 400;
    throw err;
  }

  // Confirm payment
  await db('payments').where({ id: payment_id }).update({ status: 'confirmed' });

  // Mark order as paid
  const [order] = await db('orders')
    .where({ id: payment.order_id })
    .update({ status: 'paid', updated_at: db.fn.now() })
    .returning('*');

  // Update customer total_sales if customer set
  if (order.customer_id) {
    await db('customers')
      .where({ id: order.customer_id })
      .increment('total_sales', parseFloat(payment.amount));
  }

  return { payment: { ...payment, status: 'confirmed' }, order };
};

const generateUpiQr = async (order_id) => {
  const order = await db('orders')
    .select('orders.total', 'pos_configs.upi_id', 'pos_configs.name as cafe_name')
    .leftJoin('sessions', 'orders.session_id', 'sessions.id')
    .leftJoin('pos_configs', 'sessions.pos_config_id', 'pos_configs.id')
    .where('orders.id', order_id)
    .first();

  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  if (!order.upi_id) {
    const err = new Error('UPI ID not configured');
    err.statusCode = 400;
    throw err;
  }

  const upiString = `upi://pay?pa=${order.upi_id}&pn=${encodeURIComponent(order.cafe_name)}&am=${order.total}&cu=INR`;
  const qrBase64 = await QRCode.toDataURL(upiString);

  return {
    qr: qrBase64,
    upi_id: order.upi_id,
    amount: order.total,
    upi_string: upiString,
  };
};

const list = async ({ method, date_from, date_to } = {}) => {
  const query = db('payments')
    .select(
      'payments.*',
      'orders.order_number',
      'orders.total as order_total',
      'sessions.id as session_id'
    )
    .leftJoin('orders', 'payments.order_id', 'orders.id')
    .leftJoin('sessions', 'orders.session_id', 'sessions.id')
    .where('payments.status', 'confirmed')
    .orderBy('payments.created_at', 'desc');

  if (method) query.where('payments.method', method);
  if (date_from) query.where('payments.created_at', '>=', date_from);
  if (date_to) query.where('payments.created_at', '<=', date_to);

  const payments = await query;

  // Group by method
  const grouped = { cash: [], digital: [], upi: [], all: payments };
  payments.forEach(p => {
    if (grouped[p.method]) grouped[p.method].push(p);
  });

  const summary = {
    cash: { count: grouped.cash.length, total: grouped.cash.reduce((s, p) => s + parseFloat(p.amount), 0) },
    digital: { count: grouped.digital.length, total: grouped.digital.reduce((s, p) => s + parseFloat(p.amount), 0) },
    upi: { count: grouped.upi.length, total: grouped.upi.reduce((s, p) => s + parseFloat(p.amount), 0) },
  };

  return { payments, summary };
};

module.exports = { createPayment, validatePayment, generateUpiQr, list };
