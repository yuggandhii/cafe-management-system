const db = require('../../db');

/**
 * Validate QR token and get full context:
 * table, active session, categories, products
 */
const getTableContext = async (qr_token) => {
  const table = await db('tables')
    .join('floors', 'tables.floor_id', 'floors.id')
    .select('tables.*', 'floors.name as floor_name')
    .where('tables.qr_token', qr_token)
    .first();

  if (!table) {
    const err = new Error('Invalid QR code — table not found');
    err.status = 404;
    throw err;
  }

  // Find active session for this table's floor's pos config
  // Tables belong to floors; floors don't have a direct pos_config link,
  // but we can find the most recent open session and check if it covers this table
  const session = await db('sessions')
    .join('pos_configs', 'sessions.pos_config_id', 'pos_configs.id')
    .select('sessions.*', 'pos_configs.name as config_name', 'pos_configs.enable_upi', 'pos_configs.upi_id')
    .where('sessions.status', 'open')
    .orderBy('sessions.opened_at', 'desc')
    .first();

  if (!session) {
    const err = new Error('No active POS session — the café may be closed');
    err.status = 503;
    throw err;
  }

  const categories = await db('product_categories').orderBy('sequence');

  const products = await db('products')
    .join('product_categories', 'products.category_id', 'product_categories.id')
    .select(
      'products.*',
      'product_categories.name as category_name',
      'product_categories.color as category_color'
    )
    .where('products.is_active', true)
    .orderBy('products.name');

  return { table, session, categories, products };
};

/**
 * Place a self-order for a table
 * items: [{ product_id, variant_id?, quantity, note? }]
 */
const placeOrder = async (qr_token, { items, customer_name }) => {
  if (!items || !items.length) {
    const err = new Error('No items in order');
    err.status = 400;
    throw err;
  }

  const { table, session } = await getTableContext(qr_token);

  // Check if there's already a draft/sent order for this table in this session
  // (customer may be adding more items to an existing order)
  let existingOrder = await db('orders')
    .where({ table_id: table.id, session_id: session.id })
    .whereIn('status', ['draft', 'sent_to_kitchen'])
    .first();

  return db.transaction(async (trx) => {
    let order;

    if (existingOrder) {
      order = existingOrder;
    } else {
      // Generate order number
      const today = new Date();
      const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const count = await trx('orders').whereILike('order_number', `${prefix}%`).count('id as n').first();
      const seq = String(parseInt(count.n) + 1).padStart(3, '0');
      const order_number = `${prefix}-${seq}`;

      const [newOrder] = await trx('orders')
        .insert({
          session_id: session.id,
          table_id: table.id,
          order_number,
          status: 'draft',
        })
        .returning('*');
      order = newOrder;
    }

    // Add lines
    for (const item of items) {
      const product = await trx('products').where({ id: item.product_id }).first();
      if (!product) continue;

      const unit_price = parseFloat(product.price);
      const quantity = parseInt(item.quantity) || 1;
      const tax_percent = parseFloat(product.tax_percent) || 0;
      const total = parseFloat((unit_price * quantity).toFixed(2));

      await trx('order_lines').insert({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity,
        unit_price,
        tax_percent,
        total,
        note: item.note || null,
      });
    }

    // Recalc totals
    const lines = await trx('order_lines').where({ order_id: order.id });
    const subtotal = lines.reduce((s, l) => s + parseFloat(l.total), 0);
    const tax_amount = lines.reduce(
      (s, l) => s + (parseFloat(l.total) * parseFloat(l.tax_percent)) / 100,
      0
    );
    const total = subtotal + tax_amount;

    const [updatedOrder] = await trx('orders')
      .where({ id: order.id })
      .update({
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax_amount: parseFloat(tax_amount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        status: 'sent_to_kitchen',
        updated_at: new Date(),
      })
      .returning('*');

    return { order: updatedOrder, lines };
  });
};

/**
 * Get order status (public, for tracking)
 */
const getOrderStatus = async (order_id) => {
  const order = await db('orders')
    .leftJoin('tables', 'orders.table_id', 'tables.id')
    .select('orders.*', 'tables.table_number')
    .where('orders.id', order_id)
    .first();

  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  const lines = await db('order_lines')
    .join('products', 'order_lines.product_id', 'products.id')
    .leftJoin('product_variants', 'order_lines.variant_id', 'product_variants.id')
    .select(
      'order_lines.*',
      'products.name as product_name',
      'product_variants.value as variant_value'
    )
    .where('order_lines.order_id', order_id);

  const kitchenTicket = await db('kitchen_tickets')
    .where({ order_id })
    .orderBy('created_at', 'desc')
    .first();

  return { ...order, lines, kitchen_status: kitchenTicket?.status || null };
};

module.exports = { getTableContext, placeOrder, getOrderStatus };
