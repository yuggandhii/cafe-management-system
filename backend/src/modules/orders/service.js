const db = require('../../db');
const { v4: uuidv4 } = require('uuid');

const recalcOrder = async (order_id) => {
  const lines = await db('order_lines').where({ order_id });
  const subtotal = lines.reduce((s, l) => s + parseFloat(l.subtotal), 0);
  const tax_amount = lines.reduce((s, l) => {
    const lineSubtotal = parseFloat(l.subtotal);
    return s + (lineSubtotal * parseFloat(l.tax_percent) / 100);
  }, 0);
  const total = subtotal + tax_amount;
  await db('orders').where({ id: order_id }).update({
    subtotal: subtotal.toFixed(2),
    tax_amount: tax_amount.toFixed(2),
    total: total.toFixed(2),
  });
};

const createOrder = async ({ session_id, table_id, created_by }) => {
  const maxRow = await db('orders').where({ session_id }).max('order_number as m').first();
  const order_number = (maxRow.m || 0) + 1;
  const [order] = await db('orders').insert({
    id: uuidv4(), session_id, table_id, created_by, order_number, status: 'draft',
  }).returning('*');
  return order;
};

const getOrderById = async (id) => {
  const order = await db('orders as o')
    .leftJoin('tables as t', 'o.table_id', 't.id')
    .leftJoin('customers as c', 'o.customer_id', 'c.id')
    .leftJoin('users as u', 'o.created_by', 'u.id')
    .select('o.*', 't.table_number', 'c.name as customer_name', 'u.name as staff_name')
    .where('o.id', id).first();
  if (!order) return null;
  const lines = await db('order_lines as ol')
    .join('products as p', 'ol.product_id', 'p.id')
    .leftJoin('product_variants as pv', 'ol.variant_id', 'pv.id')
    .select('ol.*', 'p.name as product_name', 'p.unit_of_measure', 'pv.value as variant_value', 'pv.attribute_name as variant_attr')
    .where('ol.order_id', id);
  return { ...order, lines };
};

const listOrders = async ({ session_id, status, search, page = 1, limit = 20 } = {}) => {
  let q = db('orders as o')
    .leftJoin('tables as t', 'o.table_id', 't.id')
    .leftJoin('customers as c', 'o.customer_id', 'c.id')
    .select('o.*', 't.table_number', 'c.name as customer_name')
    .orderBy('o.created_at', 'desc');
  if (session_id) q = q.where('o.session_id', session_id);
  if (status) q = q.where('o.status', status);
  if (search) q = q.whereILike('t.table_number', `%${search}%`);
  return q.limit(limit).offset((page - 1) * limit);
};

const addLine = async (order_id, { product_id, variant_id, quantity = 1, notes }) => {
  const product = await db('products').where({ id: product_id }).first();
  let unit_price = parseFloat(product.price);
  if (variant_id) {
    const variant = await db('product_variants').where({ id: variant_id }).first();
    if (variant) unit_price += parseFloat(variant.extra_price || 0);
  }
  const subtotal = (unit_price * quantity).toFixed(2);
  const [line] = await db('order_lines').insert({
    id: uuidv4(), order_id, product_id, variant_id, quantity, unit_price, tax_percent: product.tax_percent, subtotal, total: subtotal, notes,
  }).returning('*');
  await recalcOrder(order_id);
  return line;
};

const updateLine = async (line_id, { quantity }) => {
  const line = await db('order_lines').where({ id: line_id }).first();
  const subtotal = (parseFloat(line.unit_price) * quantity).toFixed(2);
  const [updated] = await db('order_lines').where({ id: line_id }).update({ quantity, subtotal, total: subtotal }).returning('*');
  await recalcOrder(line.order_id);
  return updated;
};

const removeLine = async (line_id) => {
  const line = await db('order_lines').where({ id: line_id }).first();
  await db('order_lines').where({ id: line_id }).del();
  await recalcOrder(line.order_id);
};

const setCustomer = async (order_id, customer_id) => {
  const [order] = await db('orders').where({ id: order_id }).update({ customer_id }).returning('*');
  return order;
};

const updateOrderStatus = async (id, status) => {
  const [order] = await db('orders').where({ id }).update({ status }).returning('*');
  return order;
};

const deleteOrder = async (id) => {
  const order = await db('orders').where({ id }).first();
  if (!order) { const e = new Error('Order not found'); e.statusCode = 404; throw e; }
  if (order.status !== 'draft') { const e = new Error('Only draft orders can be deleted'); e.statusCode = 400; throw e; }
  await db('orders').where({ id }).del();
};

module.exports = { createOrder, getOrderById, listOrders, addLine, updateLine, removeLine, setCustomer, deleteOrder, updateOrderStatus };
