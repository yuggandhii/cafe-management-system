const db = require('../../db');

const generateOrderNumber = async () => {
  const today = new Date();
  const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const count = await db('orders').whereILike('order_number', `${prefix}%`).count('id as n').first();
  const seq = String(parseInt(count.n) + 1).padStart(3, '0');
  return `${prefix}-${seq}`;
};

const getAll = (filters = {}) => {
  let q = db('orders')
    .leftJoin('tables', 'orders.table_id', 'tables.id')
    .leftJoin('customers', 'orders.customer_id', 'customers.id')
    .leftJoin('sessions', 'orders.session_id', 'sessions.id')
    .select(
      'orders.*',
      'tables.table_number',
      'customers.name as customer_name',
      'sessions.pos_config_id'
    )
    .orderBy('orders.created_at', 'desc');

  if (filters.session_id) q = q.where('orders.session_id', filters.session_id);
  if (filters.status) q = q.where('orders.status', filters.status);
  if (filters.table_id) q = q.where('orders.table_id', filters.table_id);
  return q;
};

const getById = async (id) => {
  const order = await db('orders')
    .leftJoin('tables', 'orders.table_id', 'tables.id')
    .leftJoin('customers', 'orders.customer_id', 'customers.id')
    .select('orders.*', 'tables.table_number', 'customers.name as customer_name')
    .where('orders.id', id)
    .first();

  if (!order) return null;

  const lines = await db('order_lines')
    .leftJoin('products', 'order_lines.product_id', 'products.id')
    .leftJoin('product_variants', 'order_lines.variant_id', 'product_variants.id')
    .select(
      'order_lines.*',
      'products.name as product_name',
      'product_variants.value as variant_value'
    )
    .where('order_lines.order_id', id);

  const payments = await db('payments').where({ order_id: id });

  return { ...order, lines, payments };
};

const create = async ({ session_id, table_id, customer_id }) => {
  const order_number = await generateOrderNumber();
  const [order] = await db('orders')
    .insert({ session_id, table_id, customer_id, order_number, status: 'draft' })
    .returning('*');
  return order;
};

const addLine = async (order_id, lineData) => {
  const { product_id, variant_id, quantity, unit_price, tax_percent, note } = lineData;
  const total = parseFloat((unit_price * quantity).toFixed(2));

  const [line] = await db('order_lines')
    .insert({ order_id, product_id, variant_id, quantity, unit_price, tax_percent, total, note })
    .returning('*');

  await recalcOrder(order_id);
  return line;
};

const updateLine = async (id, data) => {
  const current = await db('order_lines').where({ id }).first();
  const qty = data.quantity !== undefined ? data.quantity : current.quantity;
  const price = data.unit_price !== undefined ? data.unit_price : current.unit_price;
  const total = parseFloat((qty * price).toFixed(2));

  const [line] = await db('order_lines')
    .where({ id })
    .update({ ...data, total, updated_at: new Date() })
    .returning('*');

  await recalcOrder(current.order_id);
  return line;
};

const removeLine = async (id) => {
  const line = await db('order_lines').where({ id }).first();
  await db('order_lines').where({ id }).del();
  if (line) await recalcOrder(line.order_id);
};

const recalcOrder = async (order_id) => {
  const lines = await db('order_lines').where({ order_id });
  const subtotal = lines.reduce((sum, l) => sum + parseFloat(l.total), 0);
  const tax_amount = lines.reduce((sum, l) => {
    const taxedTotal = parseFloat(l.total) * parseFloat(l.tax_percent) / 100;
    return sum + taxedTotal;
  }, 0);
  const total = subtotal + tax_amount;

  await db('orders').where({ id: order_id }).update({
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax_amount: parseFloat(tax_amount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    updated_at: new Date(),
  });
};

const updateStatus = async (id, status) => {
  const [order] = await db('orders')
    .where({ id })
    .update({ status, updated_at: new Date() })
    .returning('*');
  return order;
};

const update = async (id, data) => {
  const [order] = await db('orders')
    .where({ id })
    .update({ ...data, updated_at: new Date() })
    .returning('*');
  return order;
};

module.exports = {
  getAll, getById, create, addLine, updateLine, removeLine, updateStatus, update, recalcOrder,
};
