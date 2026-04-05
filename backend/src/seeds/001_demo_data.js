const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Clean all tables in reverse dependency order
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

  // 1. Admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const [adminUser] = await knex('users').insert({
    name: 'Admin User',
    email: 'admin@poscape.com',
    password_hash: passwordHash,
    role: 'admin',
  }).returning('*');

  // 2. POS Config
  const [posConfig] = await knex('pos_configs').insert({
    name: 'Cawfee Tawk',
    enable_cash: true,
    enable_digital: true,
    enable_upi: true,
    upi_id: 'cawtawk@upi',
  }).returning('*');

  // 3. Floor
  const [floor] = await knex('floors').insert({
    name: 'Ground Floor',
    sequence: 1,
  }).returning('*');

  // 4. Tables (5 tables)
  const tableData = [
    { floor_id: floor.id, table_number: 'T1', seats: 2 },
    { floor_id: floor.id, table_number: 'T2', seats: 4 },
    { floor_id: floor.id, table_number: 'T3', seats: 4 },
    { floor_id: floor.id, table_number: 'T4', seats: 6 },
    { floor_id: floor.id, table_number: 'T5', seats: 8 },
  ];
  await knex('tables').insert(tableData);

  // 5. Product Categories (8 categories)
  const categories = await knex('product_categories').insert([
    { name: 'Tippy Bites',      color: '#E74C3C', sequence: 1 },
    { name: 'Momos',            color: '#9B59B6', sequence: 2 },
    { name: 'Fries',            color: '#E67E22', sequence: 3 },
    { name: 'Burgers',          color: '#D35400', sequence: 4 },
    { name: 'Sandwiches',       color: '#27AE60', sequence: 5 },
    { name: 'Pasta & Noodles',  color: '#F39C12', sequence: 6 },
    { name: 'Soups',            color: '#16A085', sequence: 7 },
    { name: 'Hot Coffee',       color: '#8B4513', sequence: 8 },
    { name: 'Cold Coffee',      color: '#2980B9', sequence: 9 },
    { name: 'Mocktails',        color: '#1ABC9C', sequence: 10 },
    { name: 'Extras / Sides',   color: '#7F8C8D', sequence: 11 },
  ]).returning('*');

  const cat = {};
  for (const c of categories) cat[c.name] = c.id;

  // 6. Products (50 products)
  const products = [
    // Tippy Bites
    { name: 'Mexican Beans',           category_id: cat['Tippy Bites'],     price: 149, tax_percent: 5 },
    { name: 'Cheese Chilli Corn',      category_id: cat['Tippy Bites'],     price: 169, tax_percent: 5 },
    // Momos
    { name: 'Classic Steam Momos',     category_id: cat['Momos'],           price: 149, tax_percent: 5 },
    { name: 'Classic Fried Momos',     category_id: cat['Momos'],           price: 159, tax_percent: 5 },
    { name: 'Peri-Peri Momos',         category_id: cat['Momos'],           price: 169, tax_percent: 5 },
    { name: 'Cheesy Paneer Momos',     category_id: cat['Momos'],           price: 189, tax_percent: 5 },
    // Fries
    { name: 'French Fries',            category_id: cat['Fries'],           price: 119, tax_percent: 5 },
    { name: 'Masala Fries',            category_id: cat['Fries'],           price: 129, tax_percent: 5 },
    { name: 'Crinkle Fries',           category_id: cat['Fries'],           price: 139, tax_percent: 5 },
    { name: 'Peri-Peri Fries',         category_id: cat['Fries'],           price: 139, tax_percent: 5 },
    // Burgers
    { name: 'Aloo Tikki Burger',       category_id: cat['Burgers'],         price: 149, tax_percent: 5 },
    { name: 'Veg Burger',              category_id: cat['Burgers'],         price: 159, tax_percent: 5 },
    { name: 'Veg Cheese Burger',       category_id: cat['Burgers'],         price: 179, tax_percent: 5 },
    { name: 'Italian Burger',          category_id: cat['Burgers'],         price: 199, tax_percent: 5 },
    // Sandwiches
    { name: 'Club Sandwich',           category_id: cat['Sandwiches'],      price: 179, tax_percent: 5 },
    { name: 'Chefs Special Sandwich',  category_id: cat['Sandwiches'],      price: 199, tax_percent: 5 },
    { name: 'Cheese Chilli Garlic Sandwich', category_id: cat['Sandwiches'],price: 189, tax_percent: 5 },
    // Pasta & Noodles
    { name: 'Fusilli Pasta',           category_id: cat['Pasta & Noodles'], price: 199, tax_percent: 5 },
    { name: 'Penne Arrabbiata',        category_id: cat['Pasta & Noodles'], price: 209, tax_percent: 5 },
    { name: 'Farfalle Pasta',          category_id: cat['Pasta & Noodles'], price: 199, tax_percent: 5 },
    { name: 'Schezwan Noodles',        category_id: cat['Pasta & Noodles'], price: 179, tax_percent: 5 },
    { name: 'Garlic Noodles',          category_id: cat['Pasta & Noodles'], price: 169, tax_percent: 5 },
    { name: 'Hakka Noodles',           category_id: cat['Pasta & Noodles'], price: 169, tax_percent: 5 },
    // Soups
    { name: 'Broccoli Almond Soup',    category_id: cat['Soups'],           price: 149, tax_percent: 5 },
    { name: 'Manchow Soup',            category_id: cat['Soups'],           price: 149, tax_percent: 5 },
    { name: 'Hot N Sour Soup',         category_id: cat['Soups'],           price: 149, tax_percent: 5 },
    { name: 'Tomato Soup',             category_id: cat['Soups'],           price: 129, tax_percent: 5 },
    { name: 'Lemon Coriander Soup',    category_id: cat['Soups'],           price: 139, tax_percent: 5 },
    // Hot Coffee
    { name: 'Cappuccino',              category_id: cat['Hot Coffee'],      price: 149, tax_percent: 5 },
    { name: 'Espresso',                category_id: cat['Hot Coffee'],      price: 99,  tax_percent: 5 },
    { name: 'Caramel Latte',           category_id: cat['Hot Coffee'],      price: 179, tax_percent: 5 },
    { name: 'Mocha',                   category_id: cat['Hot Coffee'],      price: 169, tax_percent: 5 },
    { name: 'Hazelnut Coffee',         category_id: cat['Hot Coffee'],      price: 179, tax_percent: 5 },
    { name: 'Cafe Latte',              category_id: cat['Hot Coffee'],      price: 159, tax_percent: 5 },
    { name: 'Irish Coffee',            category_id: cat['Hot Coffee'],      price: 199, tax_percent: 5 },
    // Cold Coffee
    { name: 'Hazelnut Cold Coffee',    category_id: cat['Cold Coffee'],     price: 199, tax_percent: 5 },
    { name: 'Irish Cold Coffee',       category_id: cat['Cold Coffee'],     price: 209, tax_percent: 5 },
    { name: 'Cinnamon Cold Coffee',    category_id: cat['Cold Coffee'],     price: 199, tax_percent: 5 },
    { name: 'Caramel Cold Coffee',     category_id: cat['Cold Coffee'],     price: 209, tax_percent: 5 },
    { name: 'Vanilla Cold Coffee',     category_id: cat['Cold Coffee'],     price: 189, tax_percent: 5 },
    // Mocktails
    { name: 'Mint Mojito',             category_id: cat['Mocktails'],       price: 179, tax_percent: 5 },
    { name: 'Virgin Mint Mojito',      category_id: cat['Mocktails'],       price: 169, tax_percent: 5 },
    { name: 'Green Mint Mojito',       category_id: cat['Mocktails'],       price: 169, tax_percent: 5 },
    { name: 'Blue Hawaii',             category_id: cat['Mocktails'],       price: 199, tax_percent: 5 },
    { name: 'Passion Fruit Mocktail',  category_id: cat['Mocktails'],       price: 199, tax_percent: 5 },
    { name: 'Cucumber Basil Smash',    category_id: cat['Mocktails'],       price: 189, tax_percent: 5 },
    { name: 'Orange Blossom',          category_id: cat['Mocktails'],       price: 189, tax_percent: 5 },
    { name: 'Love & Love',             category_id: cat['Mocktails'],       price: 209, tax_percent: 5 },
    // Extras / Sides
    { name: 'Garlic Bread',            category_id: cat['Extras / Sides'],  price: 99,  tax_percent: 5 },
    { name: 'Cheese Garlic Bread',     category_id: cat['Extras / Sides'],  price: 129, tax_percent: 5 },
  ];

  let seq = 1;
  for (const p of products) {
    p.sequence = seq++;
  }
  await knex('products').insert(products);

  console.log('✅ Seed complete: 1 admin, 1 POS config, 1 floor, 5 tables, 11 categories, 50 products');
};
