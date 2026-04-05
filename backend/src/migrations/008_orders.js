exports.up = function (knex) {
  return knex.schema.createTable('orders', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('session_id').notNullable().references('id').inTable('sessions').onDelete('CASCADE');
    t.uuid('table_id').nullable().references('id').inTable('tables').onDelete('SET NULL');
    t.uuid('customer_id').nullable().references('id').inTable('customers').onDelete('SET NULL');
    t.integer('order_number').notNullable();
    t.enu('status', ['draft', 'paid', 'cancelled']).defaultTo('draft');
    t.decimal('subtotal', 10, 2).defaultTo(0);
    t.decimal('tax_amount', 10, 2).defaultTo(0);
    t.decimal('total', 10, 2).defaultTo(0);
    t.text('notes').nullable();
    t.uuid('created_by').references('id').inTable('users');
    t.timestamps(true, true);
  });
};
exports.down = (knex) => knex.schema.dropTableIfExists('orders');
