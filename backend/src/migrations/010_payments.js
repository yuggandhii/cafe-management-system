exports.up = function (knex) {
  return knex.schema.createTable('payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.enu('method', ['cash', 'digital', 'upi']).notNullable();
    t.decimal('amount', 10, 2).notNullable();
    t.string('reference').nullable();
    t.enu('status', ['pending', 'confirmed']).defaultTo('pending');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};
exports.down = (knex) => knex.schema.dropTableIfExists('payments');
