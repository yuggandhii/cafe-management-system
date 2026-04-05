const db = require('../../db');

const getSummary = async ({ session_id, from, to } = {}) => {
  let ordersQ = db('orders').where({ status: 'paid' });
  if (session_id) ordersQ = ordersQ.where({ session_id });
  if (from) ordersQ = ordersQ.where('created_at', '>=', from);
  if (to) ordersQ = ordersQ.where('created_at', '<=', to);

  const orders = await ordersQ;
  const total_orders = orders.length;
  const total_revenue = orders.reduce((s, o) => s + parseFloat(o.total), 0);
  const total_tax = orders.reduce((s, o) => s + parseFloat(o.tax_amount), 0);
  const avg_order = total_orders > 0 ? total_revenue / total_orders : 0;

  // Payment breakdown
  let paymentsQ = db('payments')
    .join('orders', 'payments.order_id', 'orders.id')
    .where('orders.status', 'paid')
    .select('payments.method', db.raw('SUM(payments.amount) as total'))
    .groupBy('payments.method');

  if (session_id) paymentsQ = paymentsQ.where('orders.session_id', session_id);
  const paymentBreakdown = await paymentsQ;

  // Top products
  let topQ = db('order_lines')
    .join('orders', 'order_lines.order_id', 'orders.id')
    .join('products', 'order_lines.product_id', 'products.id')
    .where('orders.status', 'paid')
    .select('products.name', db.raw('SUM(order_lines.quantity) as qty'), db.raw('SUM(order_lines.total) as revenue'))
    .groupBy('products.name')
    .orderBy('qty', 'desc')
    .limit(10);

  if (session_id) topQ = topQ.where('orders.session_id', session_id);
  const topProducts = await topQ;

  // Sales by hour (today)
  const salesByHour = await db('orders')
    .where({ status: 'paid' })
    .select(db.raw("date_part('hour', created_at) as hour"), db.raw('SUM(total) as revenue'), db.raw('COUNT(*) as count'))
    .groupByRaw("date_part('hour', created_at)")
    .orderBy('hour');

  return {
    total_orders,
    total_revenue: parseFloat(total_revenue.toFixed(2)),
    total_tax: parseFloat(total_tax.toFixed(2)),
    avg_order: parseFloat(avg_order.toFixed(2)),
    payment_breakdown: paymentBreakdown,
    top_products: topProducts,
    sales_by_hour: salesByHour,
  };
};

module.exports = { getSummary };
