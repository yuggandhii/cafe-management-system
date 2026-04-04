const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
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

  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const staffHash = await bcrypt.hash('Staff@1234', 12);

  const [admin] = await knex('users').insert([
    { name: 'Admin User', email: 'admin@pos-cafe.com', password_hash: adminHash, role: 'admin' },
    { name: 'Staff User', email: 'staff@pos-cafe.com', password_hash: staffHash, role: 'staff' },
  ]).returning('*');

  const [config] = await knex('pos_configs').insert({
    name: 'Odoo Cafe', enable_cash: true, enable_digital: true, enable_upi: true, upi_id: '123@ybl.com',
  }).returning('*');

  const [floor] = await knex('floors').insert({
    name: 'Ground Floor', pos_config_id: config.id, sequence: 1,
  }).returning('*');

  await knex('tables').insert([
    { floor_id: floor.id, table_number: '1', seats: 4 },
    { floor_id: floor.id, table_number: '2', seats: 2 },
    { floor_id: floor.id, table_number: '3', seats: 6 },
    { floor_id: floor.id, table_number: '4', seats: 4 },
    { floor_id: floor.id, table_number: '5', seats: 8 },
  ]);

  const [food, drinks, dessert] = await knex('product_categories').insert([
    { name: 'Food', color: '#f59e0b', sequence: 1 },
    { name: 'Drinks', color: '#3b82f6', sequence: 2 },
    { name: 'Dessert', color: '#ec4899', sequence: 3 },
  ]).returning('*');

  await knex('products').insert([
    { name: 'Burger', category_id: food.id, price: 120, tax_percent: 5, unit_of_measure: 'Piece' },
    { name: 'Pizza', category_id: food.id, price: 250, tax_percent: 5, unit_of_measure: 'Piece' },
    { name: 'Pasta', category_id: food.id, price: 180, tax_percent: 5, unit_of_measure: 'Plate' },
    { name: 'Coffee', category_id: drinks.id, price: 80, tax_percent: 0, unit_of_measure: 'Cup' },
    { name: 'Water', category_id: drinks.id, price: 20, tax_percent: 0, unit_of_measure: 'Bottle' },
    { name: 'Fresh Juice', category_id: drinks.id, price: 100, tax_percent: 0, unit_of_measure: 'Glass' },
    { name: 'Brownie', category_id: dessert.id, price: 90, tax_percent: 0, unit_of_measure: 'Piece' },
    { name: 'Ice Cream', category_id: dessert.id, price: 70, tax_percent: 0, unit_of_measure: 'Scoop' },
  ]);
};
