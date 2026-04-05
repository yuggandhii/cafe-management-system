const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  // Clear any previous live orders
  await knex('order_lines').del();
  await knex('orders').del();
  await knex('sessions').del();

  const user = await knex('users').where({ role: 'admin' }).first();
  const config = await knex('pos_configs').first();
  const table = await knex('tables').first();
  
  console.log('User:', user?.id);
  console.log('Config:', config?.id);
  console.log('Table:', table?.id);

  if (!user || !config || !table) {
    throw new Error('Required entities not found in DB. Run 01_demo.js first.');
  }

  // Create an active session
  const sessionId = uuidv4();
  await knex('sessions').insert({
    id: sessionId,
    pos_config_id: config.id,
    user_id: user.id,
    start_at: knex.fn.now(),
    state: 'opened'
  });

  // Create a draft order
  const orderId = uuidv4();
  await knex('orders').insert({
    id: orderId,
    order_number: 'POS/2026/01/001',
    session_id: sessionId,
    table_id: table.id,
    customer_id: null,
    user_id: user.id,
    state: 'draft',
    subtotal: 348,
    tax_amount: 17.4,
    total: 365.4,
    items_count: 2
  });

  // Add order lines
  const cappuccino = await knex('products').where({ name: 'Cappuccino' }).first();
  const burger = await knex('products').where({ name: 'Veg. Cheese Burger' }).first();

  await knex('order_lines').insert([
    {
      id: uuidv4(),
      order_id: orderId,
      product_id: cappuccino.id,
      product_name: 'Cappuccino',
      quantity: 1,
      price_unit: cappuccino.price,
      tax_amount: (cappuccino.price * 0.05),
      total: (cappuccino.price * 1.05)
    },
    {
      id: uuidv4(),
      order_id: orderId,
      product_id: burger.id,
      product_name: 'Veg. Cheese Burger',
      quantity: 1,
      price_unit: burger.price,
      tax_amount: (burger.price * 0.05),
      total: (burger.price * 1.05)
    }
  ]);

  console.log('✅ Demo order seeded: 1 Order with 2 items.');
};
