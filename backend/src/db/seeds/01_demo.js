const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.seed = async function (knex) {
  // Clean all tables in order
  await knex('staff_payments').del();
  await knex('customer_sessions').del();
  await knex('customer_otps').del();
  await knex('self_order_tokens').del();
  await knex('kitchen_ticket_items').del();
  await knex('kitchen_tickets').del();
  await knex('payments').del();
  await knex('order_lines').del();
  await knex('orders').del();
  await knex('customers').del();
  await knex('product_variants').del();
  await knex('products').del();
  await knex('product_categories').del();
  await knex('tables').del();
  await knex('floors').del();
  await knex('sessions').del();
  await knex('pos_configs').del();
  await knex('users').del();

  // ─── USERS ───────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const staffHash = await bcrypt.hash('Staff@1234', 12);
  const kitchenHash = await bcrypt.hash('Kitchen@1234', 12);

  const [admin, staff1, staff2, kitchen1] = await knex('users').insert([
    { name: 'Yug Gandhi', email: 'admin@pos-cafe.com', password_hash: adminHash, role: 'admin', hourly_rate: 150 },
    { name: 'Raj Kumar', email: 'raj@pos-cafe.com', password_hash: staffHash, role: 'staff', hourly_rate: 80 },
    { name: 'Priya Sharma', email: 'priya@pos-cafe.com', password_hash: staffHash, role: 'staff', hourly_rate: 80 },
    { name: 'Chef Arjun', email: 'arjun@pos-cafe.com', password_hash: kitchenHash, role: 'kitchen', hourly_rate: 100 },
  ]).returning('*');

  // ─── POS CONFIG ───────────────────────────────────────
  const [config] = await knex('pos_configs').insert({
    name: 'Cawfee Tawk Cafe',
    enable_cash: true,
    enable_digital: true,
    enable_upi: true,
    upi_id: '9876543210@ybl',
  }).returning('*');

  // ─── FLOORS & TABLES ──────────────────────────────────
  const [floor1, floor2] = await knex('floors').insert([
    { name: 'Ground Floor', pos_config_id: config.id, sequence: 1 },
    { name: 'First Floor', pos_config_id: config.id, sequence: 2 },
  ]).returning('*');

  const tables = await knex('tables').insert([
    { floor_id: floor1.id, table_number: 'G1', seats: 2, qr_token: crypto.randomBytes(16).toString('hex') },
    { floor_id: floor1.id, table_number: 'G2', seats: 4, qr_token: crypto.randomBytes(16).toString('hex') },
    { floor_id: floor1.id, table_number: 'G3', seats: 4, qr_token: crypto.randomBytes(16).toString('hex') },
    { floor_id: floor1.id, table_number: 'G4', seats: 6, qr_token: crypto.randomBytes(16).toString('hex') },
    { floor_id: floor1.id, table_number: 'G5', seats: 8, qr_token: crypto.randomBytes(16).toString('hex') },
    { floor_id: floor2.id, table_number: 'F1', seats: 2, qr_token: crypto.randomBytes(16).toString('hex') },
    { floor_id: floor2.id, table_number: 'F2', seats: 4, qr_token: crypto.randomBytes(16).toString('hex') },
    { floor_id: floor2.id, table_number: 'F3', seats: 6, qr_token: crypto.randomBytes(16).toString('hex') },
  ]).returning('*');

  // ─── CATEGORIES ───────────────────────────────────────
  const [food, drinks, dessert, snacks] = await knex('product_categories').insert([
    { name: 'Food', color: '#f59e0b', sequence: 1 },
    { name: 'Drinks', color: '#3b82f6', sequence: 2 },
    { name: 'Dessert', color: '#ec4899', sequence: 3 },
    { name: 'Snacks', color: '#10b981', sequence: 4 },
  ]).returning('*');

  // ─── PRODUCTS ─────────────────────────────────────────
  const [
    burger, pizza, pasta, sandwich, biryani,
    coffee, tea, juice, coldcoffee, milkshake, water, lemonade,
    brownie, icecream, cheesecake, gulabjamun,
    fries, nachos, springrolls, momos
  ] = await knex('products').insert([
    { name: 'Burger', category_id: food.id, price: 120, tax_percent: 5, unit_of_measure: 'Piece', description: 'Juicy beef patty with lettuce and cheese' },
    { name: 'Pizza', category_id: food.id, price: 250, tax_percent: 5, unit_of_measure: 'Piece', description: 'Wood fired thin crust pizza' },
    { name: 'Pasta', category_id: food.id, price: 180, tax_percent: 5, unit_of_measure: 'Plate', description: 'Creamy white sauce penne pasta' },
    { name: 'Sandwich', category_id: food.id, price: 90, tax_percent: 5, unit_of_measure: 'Piece', description: 'Grilled veggie sandwich' },
    { name: 'Biryani', category_id: food.id, price: 220, tax_percent: 5, unit_of_measure: 'Plate', description: 'Fragrant basmati rice biryani' },
    { name: 'Coffee', category_id: drinks.id, price: 80, tax_percent: 0, unit_of_measure: 'Cup', description: 'Freshly brewed arabica coffee' },
    { name: 'Tea', category_id: drinks.id, price: 40, tax_percent: 0, unit_of_measure: 'Cup', description: 'Masala chai' },
    { name: 'Fresh Juice', category_id: drinks.id, price: 100, tax_percent: 0, unit_of_measure: 'Glass', description: 'Seasonal fresh juice' },
    { name: 'Cold Coffee', category_id: drinks.id, price: 120, tax_percent: 0, unit_of_measure: 'Glass', description: 'Chilled blended coffee' },
    { name: 'Milkshake', category_id: drinks.id, price: 140, tax_percent: 0, unit_of_measure: 'Glass', description: 'Thick creamy milkshake' },
    { name: 'Water', category_id: drinks.id, price: 20, tax_percent: 0, unit_of_measure: 'Bottle', description: 'Mineral water 500ml' },
    { name: 'Lemonade', category_id: drinks.id, price: 60, tax_percent: 0, unit_of_measure: 'Glass', description: 'Fresh mint lemonade' },
    { name: 'Brownie', category_id: dessert.id, price: 90, tax_percent: 0, unit_of_measure: 'Piece', description: 'Warm chocolate brownie' },
    { name: 'Ice Cream', category_id: dessert.id, price: 70, tax_percent: 0, unit_of_measure: 'Scoop', description: '2 scoops of premium ice cream' },
    { name: 'Cheesecake', category_id: dessert.id, price: 150, tax_percent: 0, unit_of_measure: 'Slice', description: 'New York style cheesecake' },
    { name: 'Gulab Jamun', category_id: dessert.id, price: 60, tax_percent: 0, unit_of_measure: 'Plate', description: '4 pieces with sugar syrup' },
    { name: 'French Fries', category_id: snacks.id, price: 80, tax_percent: 5, unit_of_measure: 'Plate', description: 'Crispy salted fries' },
    { name: 'Nachos', category_id: snacks.id, price: 110, tax_percent: 5, unit_of_measure: 'Plate', description: 'Nachos with salsa and cheese dip' },
    { name: 'Spring Rolls', category_id: snacks.id, price: 100, tax_percent: 5, unit_of_measure: 'Plate', description: '4 crispy veg spring rolls' },
    { name: 'Momos', category_id: snacks.id, price: 90, tax_percent: 5, unit_of_measure: 'Plate', description: '6 steamed veg momos' },
  ]).returning('*');

  // ─── VARIANTS ─────────────────────────────────────────
  await knex('product_variants').insert([
    { product_id: pizza.id, attribute_name: 'Size', value: 'Small', unit: 'Inch', extra_price: 0 },
    { product_id: pizza.id, attribute_name: 'Size', value: 'Medium', unit: 'Inch', extra_price: 80 },
    { product_id: pizza.id, attribute_name: 'Size', value: 'Large', unit: 'Inch', extra_price: 150 },
    { product_id: coffee.id, attribute_name: 'Size', value: 'Regular', unit: 'ml', extra_price: 0 },
    { product_id: coffee.id, attribute_name: 'Size', value: 'Large', unit: 'ml', extra_price: 30 },
    { product_id: icecream.id, attribute_name: 'Flavour', value: 'Chocolate', unit: '', extra_price: 0 },
    { product_id: icecream.id, attribute_name: 'Flavour', value: 'Vanilla', unit: '', extra_price: 0 },
    { product_id: icecream.id, attribute_name: 'Flavour', value: 'Strawberry', unit: '', extra_price: 10 },
    { product_id: milkshake.id, attribute_name: 'Flavour', value: 'Chocolate', unit: '', extra_price: 0 },
    { product_id: milkshake.id, attribute_name: 'Flavour', value: 'Strawberry', unit: '', extra_price: 20 },
    { product_id: milkshake.id, attribute_name: 'Flavour', value: 'Mango', unit: '', extra_price: 20 },
  ]);

  // ─── CUSTOMERS ────────────────────────────────────────
  const [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14] = await knex('customers').insert([
    { name: 'Aditya Mehta', email: 'aditya@gmail.com', phone: '9876501234', city: 'Ahmedabad', state: 'Gujarat', visit_count: 8, total_sales: 0 },
    { name: 'Sneha Patel', email: 'sneha@gmail.com', phone: '9876502345', city: 'Gandhinagar', state: 'Gujarat', visit_count: 5, total_sales: 0 },
    { name: 'Rohan Shah', email: 'rohan@gmail.com', phone: '9876503456', city: 'Surat', state: 'Gujarat', visit_count: 3, total_sales: 0 },
    { name: 'Kavya Iyer', email: 'kavya@gmail.com', phone: '9876504567', city: 'Ahmedabad', state: 'Gujarat', visit_count: 12, total_sales: 0 },
    { name: 'Aryan Joshi', email: 'aryan@gmail.com', phone: '9876505678', city: 'Vadodara', state: 'Gujarat', visit_count: 2, total_sales: 0 },
    { name: 'Meera Nair', email: 'meera@gmail.com', phone: '9876506789', city: 'Ahmedabad', state: 'Gujarat', visit_count: 6, total_sales: 0 },
    { name: 'Vikram Singh', phone: '9876507890', city: 'Rajkot', state: 'Gujarat', visit_count: 1, total_sales: 0 },
    { name: 'Pooja Desai', phone: '9876508901', city: 'Ahmedabad', state: 'Gujarat', visit_count: 4, total_sales: 0 },
    { name: 'Harsh Patel', email: 'harsh@gmail.com', phone: '9876509012', city: 'Surat', state: 'Gujarat', visit_count: 1, total_sales: 0 },
    { name: 'Nisha Sharma', email: 'nisha@gmail.com', phone: '9876510123', city: 'Ahmedabad', state: 'Gujarat', visit_count: 1, total_sales: 0 },
    { name: 'Karan Modi', phone: '9876511234', city: 'Gandhinagar', state: 'Gujarat', visit_count: 2, total_sales: 0 },
    { name: 'Riya Gupta', email: 'riya@gmail.com', phone: '9876512345', city: 'Ahmedabad', state: 'Gujarat', visit_count: 1, total_sales: 0 },
    { name: 'Dhruv Trivedi', phone: '9876513456', city: 'Vadodara', state: 'Gujarat', visit_count: 1, total_sales: 0 },
    { name: 'Ananya Singh', email: 'ananya@gmail.com', phone: '9876514567', city: 'Ahmedabad', state: 'Gujarat', visit_count: 2, total_sales: 0 },
  ]).returning('*');

  // ─── HELPER FUNCTIONS ─────────────────────────────────
  const daysAgo = (n, h = 10, m = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const addLines = async (order_id, items) => {
    let subtotal = 0, tax_amount = 0;
    for (const { product, qty, notes } of items) {
      const price = parseFloat(product.price);
      const tax = parseFloat(product.tax_percent);
      const lineSub = price * qty;
      const lineTax = lineSub * tax / 100;
      subtotal += lineSub;
      tax_amount += lineTax;
      await knex('order_lines').insert({
        order_id,
        product_id: product.id,
        quantity: qty,
        unit_price: price,
        tax_percent: tax,
        subtotal: lineSub.toFixed(2),
        total: (lineSub + lineTax).toFixed(2),
        notes: notes || null,
      });
    }
    const total = subtotal + tax_amount;
    await knex('orders').where({ id: order_id }).update({
      subtotal: subtotal.toFixed(2),
      tax_amount: tax_amount.toFixed(2),
      total: total.toFixed(2),
    });
    return total;
  };

  const payOrder = async (order_id, method, amount, customer_id) => {
    const [pmt] = await knex('payments').insert({
      order_id, method,
      amount: amount.toFixed(2),
      status: 'confirmed',
      created_at: new Date(),
    }).returning('*');
    await knex('orders').where({ id: order_id }).update({ status: 'paid' });
    if (customer_id) {
      await knex('customers').where({ id: customer_id }).increment('total_sales', amount);
    }
    return pmt;
  };

  const sendKitchen = async (order_id, session_id, status = 'completed') => {
    const lines = await knex('order_lines')
      .select('order_lines.*', 'products.name as product_name')
      .leftJoin('products', 'order_lines.product_id', 'products.id')
      .where({ order_id });
    const [ticket] = await knex('kitchen_tickets').insert({
      order_id, status,
      sent_at: new Date(),
      completed_at: status === 'completed' ? new Date() : null,
    }).returning('*');
    await knex('kitchen_ticket_items').insert(
      lines.map(l => ({
        ticket_id: ticket.id,
        order_line_id: l.id,
        product_name: l.product_name,
        quantity: l.quantity,
        is_prepared: status === 'completed',
      }))
    );
    return ticket;
  };

  // ─── SESSION 1: 7 DAYS AGO — RAJ MORNING SHIFT ────────
  const sess1Open = daysAgo(7, 9, 0);
  const sess1Close = daysAgo(7, 15, 30);
  const [sess1] = await knex('sessions').insert({
    pos_config_id: config.id,
    opened_by: staff1.id,
    opened_at: sess1Open,
    closed_at: sess1Close,
    opening_cash: 500,
    closing_cash: 3200,
    status: 'closed',
    created_at: sess1Open,
    updated_at: sess1Close,
  }).returning('*');

  // Order 1 - Table G1 - Aditya - Cash
  const [o1] = await knex('orders').insert({
    session_id: sess1.id, table_id: tables[0].id, customer_id: c1.id,
    order_number: 1, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff1.id, created_at: daysAgo(7, 9, 15), updated_at: daysAgo(7, 9, 15),
  }).returning('*');
  const t1 = await addLines(o1.id, [
    { product: burger, qty: 2, notes: 'Extra cheese' },
    { product: coffee, qty: 2 },
    { product: fries, qty: 1 },
  ]);
  await sendKitchen(o1.id, sess1.id);
  await payOrder(o1.id, 'cash', t1, c1.id);

  // Order 2 - Table G2 - Sneha - UPI
  const [o2] = await knex('orders').insert({
    session_id: sess1.id, table_id: tables[1].id, customer_id: c2.id,
    order_number: 2, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff1.id, created_at: daysAgo(7, 9, 45), updated_at: daysAgo(7, 9, 45),
  }).returning('*');
  const t2 = await addLines(o2.id, [
    { product: pizza, qty: 1, notes: 'Less spicy' },
    { product: pasta, qty: 1 },
    { product: lemonade, qty: 2 },
    { product: brownie, qty: 2 },
  ]);
  await sendKitchen(o2.id, sess1.id);
  await payOrder(o2.id, 'upi', t2, c2.id);

  // Order 3 - Table G3 - Walk-in - Digital
  const [o3] = await knex('orders').insert({
    session_id: sess1.id, table_id: tables[2].id,
    order_number: 3, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff1.id, created_at: daysAgo(7, 10, 30), updated_at: daysAgo(7, 10, 30),
  }).returning('*');
  const t3 = await addLines(o3.id, [
    { product: biryani, qty: 2 },
    { product: juice, qty: 2 },
    { product: gulabjamun, qty: 1 },
  ]);
  await sendKitchen(o3.id, sess1.id);
  await payOrder(o3.id, 'digital', t3, null);

  // Order 4 - Table G4 - Rohan - Cash
  const [o4] = await knex('orders').insert({
    session_id: sess1.id, table_id: tables[3].id, customer_id: c3.id,
    order_number: 4, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff1.id, created_at: daysAgo(7, 11, 0), updated_at: daysAgo(7, 11, 0),
  }).returning('*');
  const t4 = await addLines(o4.id, [
    { product: sandwich, qty: 3 },
    { product: coldcoffee, qty: 3 },
    { product: nachos, qty: 1 },
  ]);
  await sendKitchen(o4.id, sess1.id);
  await payOrder(o4.id, 'cash', t4, c3.id);

  // Order 5 - Self Order - Table G5 - Kavya
  const [o5] = await knex('orders').insert({
    session_id: sess1.id, table_id: tables[4].id, customer_id: c4.id,
    order_number: 5, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    notes: 'Self ordered via QR',
    created_by: staff1.id, created_at: daysAgo(7, 12, 0), updated_at: daysAgo(7, 12, 0),
  }).returning('*');
  const t5 = await addLines(o5.id, [
    { product: pizza, qty: 2, notes: 'No onion' },
    { product: milkshake, qty: 2 },
    { product: cheesecake, qty: 1 },
    { product: momos, qty: 1 },
  ]);
  await sendKitchen(o5.id, sess1.id);
  await payOrder(o5.id, 'upi', t5, c4.id);

  // Order 6 - Table F1 First Floor - Meera
  const [o6] = await knex('orders').insert({
    session_id: sess1.id, table_id: tables[5].id, customer_id: c6.id,
    order_number: 6, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff1.id, created_at: daysAgo(7, 13, 15), updated_at: daysAgo(7, 13, 15),
  }).returning('*');
  const t6 = await addLines(o6.id, [
    { product: tea, qty: 4 },
    { product: springrolls, qty: 2 },
    { product: sandwich, qty: 2 },
  ]);
  await sendKitchen(o6.id, sess1.id);
  await payOrder(o6.id, 'cash', t6, c6.id);

  await knex('pos_configs').where({ id: config.id }).update({ last_session_id: sess1.id });

  // ─── SESSION 2: 5 DAYS AGO — PRIYA EVENING SHIFT ──────
  const sess2Open = daysAgo(5, 16, 0);
  const sess2Close = daysAgo(5, 23, 0);
  const [sess2] = await knex('sessions').insert({
    pos_config_id: config.id,
    opened_by: staff2.id,
    opened_at: sess2Open,
    closed_at: sess2Close,
    opening_cash: 300,
    closing_cash: 4500,
    status: 'closed',
    created_at: sess2Open,
    updated_at: sess2Close,
  }).returning('*');

  const [o7] = await knex('orders').insert({
    session_id: sess2.id, table_id: tables[1].id, customer_id: c4.id,
    order_number: 1, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff2.id, created_at: daysAgo(5, 16, 30), updated_at: daysAgo(5, 16, 30),
  }).returning('*');
  const t7 = await addLines(o7.id, [
    { product: burger, qty: 4, notes: 'Well done' },
    { product: fries, qty: 4 },
    { product: coldcoffee, qty: 4 },
    { product: icecream, qty: 2 },
  ]);
  await sendKitchen(o7.id, sess2.id);
  await payOrder(o7.id, 'digital', t7, c4.id);

  const [o8] = await knex('orders').insert({
    session_id: sess2.id, table_id: tables[2].id, customer_id: c1.id,
    order_number: 2, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff2.id, created_at: daysAgo(5, 17, 0), updated_at: daysAgo(5, 17, 0),
  }).returning('*');
  const t8 = await addLines(o8.id, [
    { product: pizza, qty: 2 },
    { product: pasta, qty: 2 },
    { product: juice, qty: 3 },
    { product: brownie, qty: 3 },
  ]);
  await sendKitchen(o8.id, sess2.id);
  await payOrder(o8.id, 'cash', t8, c1.id);

  const [o9] = await knex('orders').insert({
    session_id: sess2.id, table_id: tables[3].id, customer_id: c7.id,
    order_number: 3, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    notes: 'Birthday table — add candle',
    created_by: staff2.id, created_at: daysAgo(5, 18, 30), updated_at: daysAgo(5, 18, 30),
  }).returning('*');
  const t9 = await addLines(o9.id, [
    { product: cheesecake, qty: 4 },
    { product: milkshake, qty: 4 },
    { product: pizza, qty: 2, notes: 'Birthday special' },
    { product: springrolls, qty: 2 },
  ]);
  await sendKitchen(o9.id, sess2.id);
  await payOrder(o9.id, 'upi', t9, c7.id);

  const [o10] = await knex('orders').insert({
    session_id: sess2.id, table_id: tables[6].id,
    order_number: 4, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff2.id, created_at: daysAgo(5, 19, 0), updated_at: daysAgo(5, 19, 0),
  }).returning('*');
  const t10 = await addLines(o10.id, [
    { product: biryani, qty: 3 },
    { product: tea, qty: 3 },
    { product: gulabjamun, qty: 2 },
  ]);
  await sendKitchen(o10.id, sess2.id);
  await payOrder(o10.id, 'cash', t10, null);

  const [o11] = await knex('orders').insert({
    session_id: sess2.id, table_id: tables[4].id, customer_id: c8.id,
    order_number: 5, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    notes: 'Self ordered via QR',
    created_by: staff2.id, created_at: daysAgo(5, 20, 0), updated_at: daysAgo(5, 20, 0),
  }).returning('*');
  const t11 = await addLines(o11.id, [
    { product: sandwich, qty: 2, notes: 'No mayo' },
    { product: lemonade, qty: 2 },
    { product: nachos, qty: 1 },
    { product: icecream, qty: 2 },
  ]);
  await sendKitchen(o11.id, sess2.id);
  await payOrder(o11.id, 'upi', t11, c8.id);

  const [o12] = await knex('orders').insert({
    session_id: sess2.id, table_id: tables[0].id, customer_id: c5.id,
    order_number: 6, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff2.id, created_at: daysAgo(5, 21, 30), updated_at: daysAgo(5, 21, 30),
  }).returning('*');
  const t12 = await addLines(o12.id, [
    { product: momos, qty: 2 },
    { product: coldcoffee, qty: 2 },
    { product: brownie, qty: 1 },
  ]);
  await sendKitchen(o12.id, sess2.id);
  await payOrder(o12.id, 'digital', t12, c5.id);

  // ─── SESSION 3: 3 DAYS AGO — RAJ FULL DAY ─────────────
  const sess3Open = daysAgo(3, 8, 0);
  const sess3Close = daysAgo(3, 22, 0);
  const [sess3] = await knex('sessions').insert({
    pos_config_id: config.id,
    opened_by: staff1.id,
    opened_at: sess3Open,
    closed_at: sess3Close,
    opening_cash: 1000,
    closing_cash: 6800,
    status: 'closed',
    created_at: sess3Open,
    updated_at: sess3Close,
  }).returning('*');

  const sess3Orders = [
    { table: tables[0], customer: c2, items: [{ product: coffee, qty: 2 }, { product: sandwich, qty: 2 }], method: 'cash', time: daysAgo(3, 8, 30) },
    { table: tables[1], customer: c3, items: [{ product: burger, qty: 3 }, { product: fries, qty: 3 }, { product: milkshake, qty: 3 }], method: 'upi', time: daysAgo(3, 9, 0) },
    { table: tables[2], customer: null, items: [{ product: tea, qty: 5 }, { product: momos, qty: 2 }, { product: nachos, qty: 1 }], method: 'cash', time: daysAgo(3, 10, 0) },
    { table: tables[3], customer: c1, items: [{ product: biryani, qty: 2, notes: 'Extra raita' }, { product: juice, qty: 2 }, { product: gulabjamun, qty: 1 }], method: 'digital', time: daysAgo(3, 11, 30) },
    { table: tables[4], customer: c4, items: [{ product: pizza, qty: 3, notes: 'Self order - extra cheese' }, { product: pasta, qty: 2 }, { product: cheesecake, qty: 2 }], method: 'upi', time: daysAgo(3, 12, 0), notes: 'Self ordered via QR' },
    { table: tables[5], customer: c6, items: [{ product: coldcoffee, qty: 4 }, { product: brownie, qty: 4 }, { product: springrolls, qty: 2 }], method: 'cash', time: daysAgo(3, 13, 0) },
    { table: tables[6], customer: c8, items: [{ product: burger, qty: 2 }, { product: lemonade, qty: 2 }, { product: icecream, qty: 2 }], method: 'digital', time: daysAgo(3, 14, 30) },
    { table: tables[7], customer: null, items: [{ product: sandwich, qty: 4 }, { product: juice, qty: 4 }, { product: nachos, qty: 2 }], method: 'cash', time: daysAgo(3, 16, 0) },
    { table: tables[0], customer: c5, items: [{ product: pizza, qty: 1 }, { product: pasta, qty: 1 }, { product: coffee, qty: 2 }], method: 'upi', time: daysAgo(3, 17, 30) },
    { table: tables[1], customer: c7, items: [{ product: biryani, qty: 4 }, { product: tea, qty: 4 }, { product: gulabjamun, qty: 2 }, { product: icecream, qty: 4 }], method: 'cash', time: daysAgo(3, 19, 0) },
  ];

  for (let i = 0; i < sess3Orders.length; i++) {
    const { table, customer, items, method, time, notes } = sess3Orders[i];
    const [ord] = await knex('orders').insert({
      session_id: sess3.id,
      table_id: table.id,
      customer_id: customer?.id || null,
      order_number: i + 1,
      status: 'draft',
      subtotal: 0, tax_amount: 0, total: 0,
      notes: notes || null,
      created_by: staff1.id,
      created_at: time, updated_at: time,
    }).returning('*');
    const total = await addLines(ord.id, items);
    await sendKitchen(ord.id, sess3.id);
    await payOrder(ord.id, method, total, customer?.id || null);
  }

  // ─── SESSION 4: YESTERDAY — PRIYA ─────────────────────
  const sess4Open = daysAgo(1, 10, 0);
  const sess4Close = daysAgo(1, 21, 0);
  const [sess4] = await knex('sessions').insert({
    pos_config_id: config.id,
    opened_by: staff2.id,
    opened_at: sess4Open,
    closed_at: sess4Close,
    opening_cash: 500,
    closing_cash: 5100,
    status: 'closed',
    created_at: sess4Open,
    updated_at: sess4Close,
  }).returning('*');

  const sess4Orders = [
    { table: tables[0], customer: c1, items: [{ product: coffee, qty: 2, notes: 'Less sugar' }, { product: cheesecake, qty: 2 }], method: 'upi', time: daysAgo(1, 10, 30) },
    { table: tables[2], customer: c3, items: [{ product: burger, qty: 2 }, { product: coldcoffee, qty: 2 }, { product: fries, qty: 2 }], method: 'cash', time: daysAgo(1, 11, 0) },
    { table: tables[3], customer: c4, items: [{ product: pizza, qty: 2, notes: 'Self ordered - no mushroom' }, { product: milkshake, qty: 2 }, { product: brownie, qty: 2 }], method: 'upi', time: daysAgo(1, 12, 30), notes: 'Self ordered via QR' },
    { table: tables[4], customer: null, items: [{ product: biryani, qty: 6 }, { product: juice, qty: 6 }, { product: gulabjamun, qty: 3 }], method: 'digital', time: daysAgo(1, 13, 0) },
    { table: tables[5], customer: c6, items: [{ product: sandwich, qty: 2 }, { product: tea, qty: 4 }, { product: springrolls, qty: 2 }, { product: momos, qty: 2 }], method: 'cash', time: daysAgo(1, 14, 0) },
    { table: tables[6], customer: c2, items: [{ product: pasta, qty: 3 }, { product: lemonade, qty: 3 }, { product: icecream, qty: 3 }], method: 'digital', time: daysAgo(1, 16, 0) },
    { table: tables[7], customer: c8, items: [{ product: nachos, qty: 2 }, { product: coldcoffee, qty: 2 }, { product: cheesecake, qty: 1 }], method: 'upi', time: daysAgo(1, 18, 0) },
    { table: tables[1], customer: c7, items: [{ product: burger, qty: 5 }, { product: fries, qty: 5 }, { product: milkshake, qty: 5 }, { product: brownie, qty: 3 }], method: 'cash', time: daysAgo(1, 19, 30) },
  ];

  for (let i = 0; i < sess4Orders.length; i++) {
    const { table, customer, items, method, time, notes } = sess4Orders[i];
    const [ord] = await knex('orders').insert({
      session_id: sess4.id,
      table_id: table.id,
      customer_id: customer?.id || null,
      order_number: i + 1,
      status: 'draft',
      subtotal: 0, tax_amount: 0, total: 0,
      notes: notes || null,
      created_by: staff2.id,
      created_at: time, updated_at: time,
    }).returning('*');
    const total = await addLines(ord.id, items);
    await sendKitchen(ord.id, sess4.id);
    await payOrder(ord.id, method, total, customer?.id || null);
  }

  // ─── SESSION 5: TODAY — ACTIVE SESSION ────────────────
  const sess5Open = new Date();
  sess5Open.setHours(9, 0, 0, 0);
  const [sess5] = await knex('sessions').insert({
    pos_config_id: config.id,
    opened_by: staff1.id,
    opened_at: sess5Open,
    opening_cash: 1000,
    status: 'open',
    created_at: sess5Open,
    updated_at: sess5Open,
  }).returning('*');

  // Today's orders
  const now = new Date();
  const [todayO1] = await knex('orders').insert({
    session_id: sess5.id, table_id: tables[0].id, customer_id: c1.id,
    order_number: 1, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff1.id,
    created_at: new Date(now.getTime() - 90 * 60000),
    updated_at: new Date(now.getTime() - 90 * 60000),
  }).returning('*');
  const tt1 = await addLines(todayO1.id, [
    { product: coffee, qty: 2 },
    { product: sandwich, qty: 2, notes: 'Toasted' },
    { product: brownie, qty: 2 },
  ]);
  await sendKitchen(todayO1.id, sess5.id);
  await payOrder(todayO1.id, 'cash', tt1, c1.id);

  const [todayO2] = await knex('orders').insert({
    session_id: sess5.id, table_id: tables[1].id, customer_id: c4.id,
    order_number: 2, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    notes: 'Self ordered via QR',
    created_by: staff1.id,
    created_at: new Date(now.getTime() - 60 * 60000),
    updated_at: new Date(now.getTime() - 60 * 60000),
  }).returning('*');
  const tt2 = await addLines(todayO2.id, [
    { product: pizza, qty: 1, notes: 'Extra cheese please' },
    { product: pasta, qty: 1 },
    { product: lemonade, qty: 2 },
    { product: cheesecake, qty: 1 },
  ]);
  await sendKitchen(todayO2.id, sess5.id);
  await payOrder(todayO2.id, 'upi', tt2, c4.id);

  const [todayO3] = await knex('orders').insert({
    session_id: sess5.id, table_id: tables[2].id,
    order_number: 3, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff1.id,
    created_at: new Date(now.getTime() - 30 * 60000),
    updated_at: new Date(now.getTime() - 30 * 60000),
  }).returning('*');
  const tt3 = await addLines(todayO3.id, [
    { product: biryani, qty: 2 },
    { product: juice, qty: 2 },
  ]);
  await sendKitchen(todayO3.id, sess5.id, 'preparing');
  await payOrder(todayO3.id, 'digital', tt3, null);

  // Active draft order — not paid yet
  const [todayO4] = await knex('orders').insert({
    session_id: sess5.id, table_id: tables[3].id, customer_id: c6.id,
    order_number: 4, status: 'draft', subtotal: 0, tax_amount: 0, total: 0,
    created_by: staff1.id,
    created_at: new Date(now.getTime() - 10 * 60000),
    updated_at: new Date(now.getTime() - 10 * 60000),
  }).returning('*');
  await addLines(todayO4.id, [
    { product: burger, qty: 2, notes: 'Make it spicy' },
    { product: coldcoffee, qty: 2 },
    { product: fries, qty: 1 },
  ]);
  await sendKitchen(todayO4.id, sess5.id, 'to_cook');

  await knex('pos_configs').where({ id: config.id }).update({ last_session_id: sess5.id });

  // ─── STAFF PAYMENTS ───────────────────────────────────
  await knex('staff_payments').insert([
    { staff_id: staff1.id, session_id: sess1.id, paid_by: admin.id, amount: 520, note: 'Shift payment - 6.5 hrs @ ₹80', status: 'paid', created_at: sess1Close },
    { staff_id: staff2.id, session_id: sess2.id, paid_by: admin.id, amount: 560, note: 'Shift payment - 7 hrs @ ₹80', status: 'paid', created_at: sess2Close },
    { staff_id: staff1.id, session_id: sess3.id, paid_by: admin.id, amount: 1120, note: 'Full day shift - 14 hrs @ ₹80', status: 'paid', created_at: sess3Close },
    { staff_id: staff2.id, session_id: sess4.id, paid_by: admin.id, amount: 880, note: 'Shift payment - 11 hrs @ ₹80', status: 'paid', created_at: sess4Close },
  ]);

  console.log('✅ Seed complete:');
  console.log('   4 users (admin, 2 staff, 1 kitchen)');
  console.log('   2 floors, 8 tables');
  console.log('   4 categories, 20 products, 11 variants');
  console.log('   8 customers');
  console.log('   5 sessions (4 closed, 1 open today)');
  console.log('   35+ orders across 7 days');
  console.log('   All with kitchen tickets and payments');
};