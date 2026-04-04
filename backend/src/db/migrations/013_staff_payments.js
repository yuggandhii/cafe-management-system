exports.up = function(knex) {
  return knex.schema.createTable('staff_payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('staff_id').references('id').inTable('users').onDelete('CASCADE');
    t.uuid('session_id').references('id').inTable('sessions').onDelete('SET NULL').nullable();
    t.uuid('paid_by').references('id').inTable('users');
    t.decimal('amount', 10, 2).notNullable();
    t.string('note').nullable();
    t.enum('status', ['pending', 'paid']).defaultTo('paid');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('staff_payments');
};
