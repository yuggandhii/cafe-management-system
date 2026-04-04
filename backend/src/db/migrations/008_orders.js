exports.up = function(knex) {
  return knex.schema.createTable('orders', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('session_id').references('id').inTable('sessions').onDelete('CASCADE');
    t.uuid('table_id').references('id').inTable('tables').onDelete('SET NULL').nullable();
    t.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL').nullable();
    t.integer('order_number').notNullable();
    t.enum('status', ['draft', 'paid', 'archived']).defaultTo('draft');
    t.decimal('subtotal', 10, 2).defaultTo(0);
    t.decimal('tax_amount', 10, 2).defaultTo(0);
    t.decimal('total', 10, 2).defaultTo(0);
    t.text('notes').nullable();
    t.uuid('created_by').references('id').inTable('users');
    t.timestamps(true, true);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};
