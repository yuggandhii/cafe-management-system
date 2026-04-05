const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  // Clear all tables in reverse order
  await knex('self_order_tokens').del().catch(() => {});
  await knex('kitchen_ticket_items').del().catch(() => {});
  await knex('kitchen_tickets').del().catch(() => {});
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

  // Users
  const adminId = uuidv4();
  const staffId = uuidv4();
  const kitchenId = uuidv4();
  const hash = (p) => bcrypt.hashSync(p, 10);

  await knex('users').insert([
    { id: adminId, name: 'Admin User', email: 'admin@cawfeetawk.com', password_hash: hash('Admin@1234'), role: 'admin' },
    { id: staffId, name: 'Staff One', email: 'staff@cawfeetawk.com', password_hash: hash('Staff@1234'), role: 'staff' },
    { id: kitchenId, name: 'Kitchen Staff', email: 'kitchen@cawfeetawk.com', password_hash: hash('Kitchen@1234'), role: 'kitchen' },
  ]);

  // POS Config
  const configId = uuidv4();
  await knex('pos_configs').insert({
    id: configId, name: 'Cawfee Tawk POS',
    enable_cash: true, enable_digital: true, enable_upi: true, upi_id: '123@ybl',
  });

  // Floors + Tables
  const floorId = uuidv4();
  const floor2Id = uuidv4();
  await knex('floors').insert([
    { id: floorId, name: 'Ground Floor', pos_config_id: configId, sequence: 1 },
    { id: floor2Id, name: 'First Floor', pos_config_id: configId, sequence: 2 },
  ]);

  const tables = [];
  for (let i = 1; i <= 12; i++) {
    tables.push({ id: uuidv4(), floor_id: floorId, table_number: `T${i}`, seats: i <= 4 ? 2 : 4, active: true, qr_token: `table-token-gf-${i}` });
  }
  for (let i = 1; i <= 8; i++) {
    tables.push({ id: uuidv4(), floor_id: floor2Id, table_number: `F${i}`, seats: i <= 3 ? 2 : 6, active: true, qr_token: `table-token-ff-${i}` });
  }
  await knex('tables').insert(tables);

  // Categories
  const cats = [
    { id: uuidv4(), name: 'Tippy Bites', color: '#FEF3C7', sequence: 1 },
    { id: uuidv4(), name: 'Momos', color: '#FCE7F3', sequence: 2 },
    { id: uuidv4(), name: 'Fries', color: '#FFF7ED', sequence: 3 },
    { id: uuidv4(), name: 'Burgers & Sandwiches', color: '#FEF9C3', sequence: 4 },
    { id: uuidv4(), name: 'Pasta & Noodles', color: '#F0FDFA', sequence: 5 },
    { id: uuidv4(), name: 'Soups', color: '#EFF6FF', sequence: 6 },
    { id: uuidv4(), name: 'Hot Coffee', color: '#FDF4FF', sequence: 7 },
    { id: uuidv4(), name: 'Cold Coffee', color: '#F0F9FF', sequence: 8 },
    { id: uuidv4(), name: 'Mocktails', color: '#F0FDF4', sequence: 9 },
    { id: uuidv4(), name: 'Extras', color: '#F8FAFC', sequence: 10 },
  ];
  await knex('product_categories').insert(cats);

  const catMap = {};
  cats.forEach(c => { catMap[c.name] = c.id; });

  // Products with image_url as proper DB column
  const FOOD_IMAGES = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80',
    'https://images.unsplash.com/photo-1484723091791-caff3228fe1f?w=400&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
    'https://images.unsplash.com/photo-1481070555726-e2fe83477d15?w=400&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80',
  ];

  const products = [
    // Tippy Bites
    { name: 'Tippy Mexican Beans', category_id: catMap['Tippy Bites'], price: 169, tax_percent: 5 },
    { name: 'Tippy Cheese Chilli Corn', category_id: catMap['Tippy Bites'], price: 169, tax_percent: 5 },
    { name: 'Dragon Potato', category_id: catMap['Tippy Bites'], price: 189, tax_percent: 5 },
    { name: 'Crispy Corn', category_id: catMap['Tippy Bites'], price: 159, tax_percent: 5 },
    // Momos
    { name: 'Classic Momos (Steam)', category_id: catMap['Momos'], price: 199, tax_percent: 5 },
    { name: 'Classic Momos (Fried)', category_id: catMap['Momos'], price: 249, tax_percent: 5 },
    { name: 'Peri-Peri Momos (Steam)', category_id: catMap['Momos'], price: 239, tax_percent: 5 },
    { name: 'Cheesy Paneer Momos (Fried)', category_id: catMap['Momos'], price: 279, tax_percent: 5 },
    { name: 'Schezwan Momos (Steam)', category_id: catMap['Momos'], price: 199, tax_percent: 5 },
    { name: 'Tandoori Momos', category_id: catMap['Momos'], price: 259, tax_percent: 5 },
    // Fries
    { name: 'French Fries', category_id: catMap['Fries'], price: 119, tax_percent: 5 },
    { name: 'Masala Fries', category_id: catMap['Fries'], price: 139, tax_percent: 5 },
    { name: 'Crinkle Fries', category_id: catMap['Fries'], price: 149, tax_percent: 5 },
    { name: 'Peri-Peri Fries', category_id: catMap['Fries'], price: 159, tax_percent: 5 },
    // Burgers & Sandwiches
    { name: 'Aloo Tikki Burger', category_id: catMap['Burgers & Sandwiches'], price: 189, tax_percent: 5 },
    { name: 'Veg. Cheese Burger', category_id: catMap['Burgers & Sandwiches'], price: 219, tax_percent: 5 },
    { name: 'Italian Burger', category_id: catMap['Burgers & Sandwiches'], price: 229, tax_percent: 5 },
    { name: 'Club Sandwich', category_id: catMap['Burgers & Sandwiches'], price: 269, tax_percent: 5 },
    { name: 'Cheese Chilli Garlic Sandwich', category_id: catMap['Burgers & Sandwiches'], price: 189, tax_percent: 5 },
    { name: "Chef's Special Wrap", category_id: catMap['Burgers & Sandwiches'], price: 249, tax_percent: 5 },
    // Pasta & Noodles
    { name: 'Fusilli', category_id: catMap['Pasta & Noodles'], price: 289, tax_percent: 5, description: 'Any one sauce: Red / Cheese / White / Pesto' },
    { name: 'Penne', category_id: catMap['Pasta & Noodles'], price: 219, tax_percent: 5, description: 'Any one sauce: Red / Cheese / White / Pesto' },
    { name: 'Farfalle', category_id: catMap['Pasta & Noodles'], price: 249, tax_percent: 5, description: 'Any one sauce: Red / Cheese / White / Pesto' },
    { name: 'Veg. Hakka Noodles', category_id: catMap['Pasta & Noodles'], price: 249, tax_percent: 5 },
    { name: 'Schezwan Noodles', category_id: catMap['Pasta & Noodles'], price: 249, tax_percent: 5 },
    { name: 'Garlic Noodles', category_id: catMap['Pasta & Noodles'], price: 249, tax_percent: 5 },
    // Soups
    { name: 'Broccoli Almond Soup', category_id: catMap['Soups'], price: 239, tax_percent: 5 },
    { name: 'Manchow Soup', category_id: catMap['Soups'], price: 219, tax_percent: 5 },
    { name: 'Hot N Sour Soup', category_id: catMap['Soups'], price: 219, tax_percent: 5 },
    { name: 'Tomato Soup', category_id: catMap['Soups'], price: 219, tax_percent: 5 },
    { name: 'Lemon Coriander Soup', category_id: catMap['Soups'], price: 239, tax_percent: 5 },
    // Hot Coffee
    { name: 'Cappuccino', category_id: catMap['Hot Coffee'], price: 129, tax_percent: 5, send_to_kitchen: false },
    { name: 'Espresso', category_id: catMap['Hot Coffee'], price: 69, tax_percent: 5, send_to_kitchen: false },
    { name: 'Caramel Cappuccino', category_id: catMap['Hot Coffee'], price: 179, tax_percent: 5, send_to_kitchen: false },
    { name: 'Mocha Cappuccino', category_id: catMap['Hot Coffee'], price: 179, tax_percent: 5, send_to_kitchen: false },
    { name: 'Hazelnut Cappuccino', category_id: catMap['Hot Coffee'], price: 179, tax_percent: 5, send_to_kitchen: false },
    { name: 'Latte Coffee', category_id: catMap['Hot Coffee'], price: 179, tax_percent: 5, send_to_kitchen: false },
    { name: 'Hot Chocolate', category_id: catMap['Hot Coffee'], price: 169, tax_percent: 5, send_to_kitchen: false },
    // Cold Coffee
    { name: 'Cold Coffee - Hazelnut', category_id: catMap['Cold Coffee'], price: 249, tax_percent: 5, send_to_kitchen: false },
    { name: 'Cold Coffee - Irish', category_id: catMap['Cold Coffee'], price: 249, tax_percent: 5, send_to_kitchen: false },
    { name: 'Cold Coffee - Caramel', category_id: catMap['Cold Coffee'], price: 249, tax_percent: 5, send_to_kitchen: false },
    { name: 'Cold Coffee - Vanilla', category_id: catMap['Cold Coffee'], price: 249, tax_percent: 5, send_to_kitchen: false },
    { name: 'Cold Coffee - Cinnamon', category_id: catMap['Cold Coffee'], price: 249, tax_percent: 5, send_to_kitchen: false },
    // Mocktails
    { name: 'Mint Mojito - Cranberry', category_id: catMap['Mocktails'], price: 189, tax_percent: 5, send_to_kitchen: false },
    { name: 'Mint Mojito - Green Apple', category_id: catMap['Mocktails'], price: 189, tax_percent: 5, send_to_kitchen: false },
    { name: 'Mint Mojito - Passion Fruit', category_id: catMap['Mocktails'], price: 189, tax_percent: 5, send_to_kitchen: false },
    { name: 'Blue Hawaii', category_id: catMap['Mocktails'], price: 219, tax_percent: 5, send_to_kitchen: false },
    { name: 'Passion Fruit Cooler', category_id: catMap['Mocktails'], price: 209, tax_percent: 5, send_to_kitchen: false },
    { name: 'Cucumber Basil Smash', category_id: catMap['Mocktails'], price: 209, tax_percent: 5, send_to_kitchen: false },
    { name: 'Love & Love', category_id: catMap['Mocktails'], price: 399, tax_percent: 5, send_to_kitchen: false },
    // Extras
    { name: 'Garlic Bread', category_id: catMap['Extras'], price: 189, tax_percent: 5 },
    { name: 'Cheese Garlic Bread', category_id: catMap['Extras'], price: 199, tax_percent: 5 },
  ];

  const productRows = products.map((p, idx) => ({
    id: uuidv4(),
    name: p.name,
    category_id: p.category_id,
    price: p.price,
    tax_percent: p.tax_percent ?? 5,
    unit_of_measure: 'Piece',
    description: p.description || null,
    image_url: FOOD_IMAGES[idx % FOOD_IMAGES.length], // assign real images from the start
    is_active: true,
    send_to_kitchen: p.send_to_kitchen !== undefined ? p.send_to_kitchen : true,
  }));

  await knex('products').insert(productRows);

  // --- 30 INDIAN CUSTOMERS ---
  const indianNames = [
    'Aarav Patel', 'Diya Sharma', 'Vihaan Singh', 'Ananya Gupta', 'Aditya Verma',
    'Ishita Rao', 'Karan Desai', 'Meera Reddy', 'Rohan Nair', 'Kavya Iyer',
    'Arjun Menon', 'Neha Joshi', 'Pranav Kapoor', 'Riya Bose', 'Siddharth Malhotra',
    'Tanvi Pillai', 'Akash Tiwari', 'Sneha Kulkarni', 'Dev Choudhary', 'Pooja Bansal',
    'Ritesh Narayan', 'Simran Ahuja', 'Ayaan Khanna', 'Lavanya Srivastava', 'Nikhil Saxena',
    'Priya Mishra', 'Harsh Aggarwal', 'Swati Pandey', 'Yash Trivedi', 'Divya Mehta',
  ];

  const customers = indianNames.map((name, idx) => ({
    id: uuidv4(),
    name,
    phone: '98' + (10000000 + idx * 1337).toString().padStart(8, '0'),
    email: `${name.toLowerCase().replace(/ /g, '.')}@gmail.com`,
    created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
  }));
  await knex('customers').insert(customers);

  const sessionId = uuidv4();
  await knex('sessions').insert({
    id: sessionId,
    pos_config_id: configId,
    opened_by: adminId,
    status: 'closed',
    opening_cash: 1000,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  });

  const orders = [];
  const orderLines = [];
  const payments = [];

  // 500+ orders with sequential order numbers starting from 1
  const TOTAL_ORDERS = 520;

  for (let i = 0; i < TOTAL_ORDERS; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const hour = Math.floor(Math.random() * 14) + 8; // 8 AM to 10 PM
    const min = Math.floor(Math.random() * 60);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysAgo);
    orderDate.setHours(hour, min, 0, 0);

    const orderId = uuidv4();
    const customer = customers[Math.floor(Math.random() * customers.length)];

    let subtotal = 0;
    const numItems = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < numItems; j++) {
      const prod = productRows[Math.floor(Math.random() * productRows.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const lineTotal = prod.price * qty;
      subtotal += lineTotal;
      orderLines.push({
        id: uuidv4(),
        order_id: orderId,
        product_id: prod.id,
        quantity: qty,
        unit_price: prod.price,
        subtotal: lineTotal.toFixed(2),
        total: lineTotal.toFixed(2),
        tax_percent: prod.tax_percent,
        created_at: orderDate,
      });
    }

    const taxAmount = subtotal * 0.05;
    const total = subtotal + taxAmount;

    orders.push({
      id: orderId,
      session_id: sessionId,
      customer_id: customer.id,
      order_number: i + 1, // sequential from 1
      subtotal: subtotal.toFixed(2),
      tax_amount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      status: 'paid',
      created_at: orderDate,
    });

    const methods = ['upi', 'cash', 'digital'];
    payments.push({
      id: uuidv4(),
      order_id: orderId,
      method: methods[Math.floor(Math.random() * methods.length)],
      amount: total.toFixed(2),
      status: 'confirmed',
      reference: `REF-${Date.now()}-${i}`,
      created_at: orderDate,
    });
  }

  const chunkSize = 100;
  for (let i = 0; i < orders.length; i += chunkSize) {
    await knex('orders').insert(orders.slice(i, i + chunkSize));
  }
  for (let i = 0; i < orderLines.length; i += chunkSize) {
    await knex('order_lines').insert(orderLines.slice(i, i + chunkSize));
  }
  for (let i = 0; i < payments.length; i += chunkSize) {
    await knex('payments').insert(payments.slice(i, i + chunkSize));
  }

  console.log(`✅ Seed complete:`);
  console.log(`   - ${productRows.length} products with real image URLs`);
  console.log(`   - ${customers.length} Indian customers`);
  console.log(`   - ${TOTAL_ORDERS} historical orders (sequential IDs 1-${TOTAL_ORDERS})`);
  console.log(`   - 2 floors, 20 tables`);
};
