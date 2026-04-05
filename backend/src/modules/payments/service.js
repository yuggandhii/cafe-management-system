const db = require('../../db');
const QRCode = require('qrcode');
const orderService = require('../orders/service');
const kitchenService = require('../kitchen/service');

const getByOrder = (order_id) => db('payments').where({ order_id });

const processPayment = async (order_id, method, amount, io) => {
  const order = await db('orders').where({ id: order_id }).first();
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  return db.transaction(async (trx) => {
    const [payment] = await trx('payments')
      .insert({ order_id, method, amount, status: 'confirmed' })
      .returning('*');

    // Update order status to paid
    await trx('orders')
      .where({ id: order_id })
      .update({ status: 'paid', updated_at: new Date() });

    // Update customer total_sales if customer attached
    if (order.customer_id) {
      await trx('customers')
        .where({ id: order.customer_id })
        .increment('total_sales', parseFloat(amount));
    }

    // Emit socket event
    if (io) {
      io.to(`session_${order.session_id}`).emit('payment:confirmed', {
        order_id,
        payment,
      });
    }

    return payment;
  });
};

const generateUpiQr = async (upi_id, amount, order_number) => {
  const upiUrl = `upi://pay?pa=${upi_id}&pn=CawfeeTawk&am=${amount}&cu=INR&tn=${order_number}`;
  const qrDataUrl = await QRCode.toDataURL(upiUrl, { width: 300, margin: 2 });
  return qrDataUrl;
};

const getAll = (filters = {}) => {
  let q = db('payments')
    .join('orders', 'payments.order_id', 'orders.id')
    .leftJoin('tables', 'orders.table_id', 'tables.id')
    .select('payments.*', 'orders.order_number', 'orders.total as order_total', 'tables.table_number')
    .orderBy('payments.created_at', 'desc');

  if (filters.method) q = q.where('payments.method', filters.method);
  if (filters.session_id) q = q.where('orders.session_id', filters.session_id);
  return q;
};

module.exports = { getAll, getByOrder, processPayment, generateUpiQr };
