const db = require('../../db');

const getDashboard = async ({ pos_config_id, period = 'today', session_id, responsible_id, product_id } = {}) => {
  const dateFilter = getDateFilter(period);
  let q = db('orders as o')
    .join('sessions as s', 'o.session_id', 's.id')
    .where('o.status', 'paid');
  if (pos_config_id) q = q.where('s.pos_config_id', pos_config_id);
  if (session_id) q = q.where('o.session_id', session_id);
  if (responsible_id) q = q.where('s.opened_by', responsible_id);
  if (dateFilter) q = q.where('o.created_at', '>=', dateFilter);

  const orders = await q.select('o.total', 'o.created_at');
  const total_orders = orders.length;
  const revenue = orders.reduce((s, o) => s + parseFloat(o.total), 0);
  const avg_order = total_orders > 0 ? revenue / total_orders : 0;

  return { total_orders, revenue: revenue.toFixed(2), avg_order: avg_order.toFixed(2) };
};

const getSalesChart = async ({ pos_config_id, period = 'today', session_id } = {}) => {
  const dateFilter = getDateFilter(period);
  let q = db('orders as o')
    .join('sessions as s', 'o.session_id', 's.id')
    .where('o.status', 'paid')
    .select('o.total', 'o.created_at')
    .orderBy('o.created_at');
  if (pos_config_id) q = q.where('s.pos_config_id', pos_config_id);
  if (session_id) q = q.where('o.session_id', session_id);
  if (dateFilter) q = q.where('o.created_at', '>=', dateFilter);
  const rows = await q;
  return rows.map(r => ({ time: r.created_at, value: parseFloat(r.total) }));
};

const getTopCategories = async ({ pos_config_id, period = 'today', session_id } = {}) => {
  const dateFilter = getDateFilter(period);
  let q = db('order_lines as ol')
    .join('orders as o', 'ol.order_id', 'o.id')
    .join('sessions as s', 'o.session_id', 's.id')
    .join('products as p', 'ol.product_id', 'p.id')
    .join('product_categories as c', 'p.category_id', 'c.id')
    .where('o.status', 'paid')
    .groupBy('c.id', 'c.name', 'c.color')
    .select('c.name', 'c.color', db.raw('SUM(ol.total) as revenue'))
    .orderBy('revenue', 'desc');
  if (pos_config_id) q = q.where('s.pos_config_id', pos_config_id);
  if (session_id) q = q.where('o.session_id', session_id);
  if (dateFilter) q = q.where('o.created_at', '>=', dateFilter);
  return q;
};

const getTopProducts = async ({ pos_config_id, period = 'today', session_id } = {}) => {
  const dateFilter = getDateFilter(period);
  let q = db('order_lines as ol')
    .join('orders as o', 'ol.order_id', 'o.id')
    .join('sessions as s', 'o.session_id', 's.id')
    .join('products as p', 'ol.product_id', 'p.id')
    .where('o.status', 'paid')
    .groupBy('p.id', 'p.name')
    .select('p.name', db.raw('SUM(ol.quantity) as qty'), db.raw('SUM(ol.total) as revenue'))
    .orderBy('revenue', 'desc');
  if (pos_config_id) q = q.where('s.pos_config_id', pos_config_id);
  if (session_id) q = q.where('o.session_id', session_id);
  if (dateFilter) q = q.where('o.created_at', '>=', dateFilter);
  return q;
};

const getTopOrders = async ({ pos_config_id, period = 'today', session_id } = {}) => {
  const dateFilter = getDateFilter(period);
  let q = db('orders as o')
    .join('sessions as s', 'o.session_id', 's.id')
    .leftJoin('tables as t', 'o.table_id', 't.id')
    .leftJoin('users as u', 's.opened_by', 'u.id')
    .leftJoin('customers as c', 'o.customer_id', 'c.id')
    .where('o.status', 'paid')
    .select('o.order_number', 'o.total', 'o.created_at', 't.table_number', 'u.name as employee', 'c.name as customer_name', 's.id as session_id')
    .orderBy('o.created_at', 'desc').limit(50);
  if (pos_config_id) q = q.where('s.pos_config_id', pos_config_id);
  if (session_id) q = q.where('o.session_id', session_id);
  if (dateFilter) q = q.where('o.created_at', '>=', dateFilter);
  return q;
};

function getDateFilter(period) {
  const now = new Date();
  if (period === 'today') {
    const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
  }
  if (period === 'week') {
    const d = new Date(now); d.setDate(d.getDate() - 7); return d;
  }
  if (period === 'month') {
    const d = new Date(now); d.setMonth(d.getMonth() - 1); return d;
  }
  if (period === '365') {
    const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d;
  }
  return null;
}

module.exports = { getDashboard, getSalesChart, getTopCategories, getTopProducts, getTopOrders };
