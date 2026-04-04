const db = require('../../db');

const getPeriodDates = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case 'today':
      return { from: today, to: now };
    case 'weekly':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      return { from: weekStart, to: now };
    case 'monthly':
      const monthStart = new Date(today);
      monthStart.setDate(today.getDate() - 30);
      return { from: monthStart, to: now };
    case 'yearly':
      const yearStart = new Date(today);
      yearStart.setDate(today.getDate() - 365);
      return { from: yearStart, to: now };
    default:
      return { from: today, to: now };
  }
};

const getDashboard = async ({ pos_config_id, period = 'today', session_id, responsible_id, product_id } = {}) => {
  const { from, to } = getPeriodDates(period);

  const query = db('orders')
    .leftJoin('sessions', 'orders.session_id', 'sessions.id')
    .where('orders.status', 'paid')
    .where('orders.created_at', '>=', from)
    .where('orders.created_at', '<=', to);

  if (pos_config_id) query.where('sessions.pos_config_id', pos_config_id);
  if (session_id) query.where('orders.session_id', session_id);
  if (responsible_id) query.where('orders.created_by', responsible_id);

  if (product_id) {
    query.whereExists(
      db('order_lines')
        .where('order_lines.order_id', db.raw('orders.id'))
        .where('order_lines.product_id', product_id)
    );
  }

  const orders = await query.select('orders.total', 'orders.id');
  const total_orders = orders.length;
  const revenue = orders.reduce((s, o) => s + parseFloat(o.total), 0);
  const avg_order = total_orders > 0 ? revenue / total_orders : 0;

  // Previous period for % change
  const periodMs = to - from;
  const prevFrom = new Date(from - periodMs);
  const prevTo = new Date(from);

  const prevQuery = db('orders')
    .leftJoin('sessions', 'orders.session_id', 'sessions.id')
    .where('orders.status', 'paid')
    .where('orders.created_at', '>=', prevFrom)
    .where('orders.created_at', '<=', prevTo);

  if (pos_config_id) prevQuery.where('sessions.pos_config_id', pos_config_id);

  const prevOrders = await prevQuery.select('orders.total');
  const prev_revenue = prevOrders.reduce((s, o) => s + parseFloat(o.total), 0);
  const revenue_change = prev_revenue > 0 ? ((revenue - prev_revenue) / prev_revenue * 100).toFixed(1) : 0;

  return {
    total_orders,
    revenue: revenue.toFixed(2),
    avg_order: avg_order.toFixed(2),
    revenue_change,
    period,
  };
};

const getSalesChart = async ({ period = 'today', pos_config_id, session_id } = {}) => {
  const { from, to } = getPeriodDates(period);

  const orders = await db('orders')
    .select('orders.total', 'orders.created_at')
    .leftJoin('sessions', 'orders.session_id', 'sessions.id')
    .where('orders.status', 'paid')
    .where('orders.created_at', '>=', from)
    .where('orders.created_at', '<=', to)
    .modify((q) => {
      if (pos_config_id) q.where('sessions.pos_config_id', pos_config_id);
      if (session_id) q.where('orders.session_id', session_id);
    })
    .orderBy('orders.created_at', 'asc');

  // Group by hour for today, by day for weekly/monthly
  const grouped = {};
  orders.forEach(o => {
    const d = new Date(o.created_at);
    const key = period === 'today'
      ? `${d.getHours()}:00`
      : `${d.getDate()}/${d.getMonth() + 1}`;
    if (!grouped[key]) grouped[key] = 0;
    grouped[key] += parseFloat(o.total);
  });

  return Object.entries(grouped).map(([time, revenue]) => ({ time, revenue: revenue.toFixed(2) }));
};

const getTopCategories = async ({ period = 'today', pos_config_id } = {}) => {
  const { from, to } = getPeriodDates(period);

  const rows = await db('order_lines')
    .select('product_categories.name as category', db.raw('SUM(order_lines.total) as revenue'))
    .leftJoin('products', 'order_lines.product_id', 'products.id')
    .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
    .leftJoin('orders', 'order_lines.order_id', 'orders.id')
    .leftJoin('sessions', 'orders.session_id', 'sessions.id')
    .where('orders.status', 'paid')
    .where('orders.created_at', '>=', from)
    .where('orders.created_at', '<=', to)
    .modify((q) => { if (pos_config_id) q.where('sessions.pos_config_id', pos_config_id); })
    .groupBy('product_categories.name')
    .orderBy('revenue', 'desc');

  const total = rows.reduce((s, r) => s + parseFloat(r.revenue), 0);
  return rows.map(r => ({
    category: r.category || 'Uncategorized',
    revenue: parseFloat(r.revenue).toFixed(2),
    percent: total > 0 ? ((parseFloat(r.revenue) / total) * 100).toFixed(1) : 0,
  }));
};

const getTopProducts = async ({ period = 'today', pos_config_id } = {}) => {
  const { from, to } = getPeriodDates(period);

  return db('order_lines')
    .select(
      'products.name as product',
      db.raw('SUM(order_lines.quantity) as qty'),
      db.raw('SUM(order_lines.total) as revenue')
    )
    .leftJoin('products', 'order_lines.product_id', 'products.id')
    .leftJoin('orders', 'order_lines.order_id', 'orders.id')
    .leftJoin('sessions', 'orders.session_id', 'sessions.id')
    .where('orders.status', 'paid')
    .where('orders.created_at', '>=', from)
    .where('orders.created_at', '<=', to)
    .modify((q) => { if (pos_config_id) q.where('sessions.pos_config_id', pos_config_id); })
    .groupBy('products.name')
    .orderBy('revenue', 'desc')
    .limit(5);
};

const getTopOrders = async ({ period = 'today', pos_config_id, session_id } = {}) => {
  const { from, to } = getPeriodDates(period);

  return db('orders')
    .select(
      'orders.id',
      'orders.order_number',
      'orders.total',
      'orders.created_at',
      'users.name as employee',
      'tables.table_number',
      'sessions.id as session_id'
    )
    .leftJoin('users', 'orders.created_by', 'users.id')
    .leftJoin('tables', 'orders.table_id', 'tables.id')
    .leftJoin('sessions', 'orders.session_id', 'sessions.id')
    .where('orders.status', 'paid')
    .where('orders.created_at', '>=', from)
    .where('orders.created_at', '<=', to)
    .modify((q) => {
      if (pos_config_id) q.where('sessions.pos_config_id', pos_config_id);
      if (session_id) q.where('orders.session_id', session_id);
    })
    .orderBy('orders.total', 'desc')
    .limit(10);
};

module.exports = { getDashboard, getSalesChart, getTopCategories, getTopProducts, getTopOrders };
