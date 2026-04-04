exports.up = function(knex) {
  return knex.schema.createTable('orders', (t) => {
    t.increments('id').primary();
    t.integer('session_id').references('id').inTable('sessions').onDelete('CASCADE');
    t.integer('table_id').references('id').inTable('tables').onDelete('SET NULL').nullable();
    t.integer('customer_id').references('id').inTable('customers').onDelete('SET NULL').nullable();
    t.integer('order_number').notNullable();
    t.enum('status', ['draft', 'paid', 'archived']).defaultTo('draft');
    t.decimal('subtotal', 10, 2).defaultTo(0);
    t.decimal('tax_amount', 10, 2).defaultTo(0);
    t.decimal('total', 10, 2).defaultTo(0);
    t.text('notes').nullable();
    t.integer('created_by').references('id').inTable('users');
    t.timestamps(true, true);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};
