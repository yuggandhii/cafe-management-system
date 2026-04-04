exports.up = function(knex) {
  return knex.schema.createTable('staff_payments', (t) => {
    t.increments('id').primary();
    t.integer('staff_id').references('id').inTable('users').onDelete('CASCADE');
    t.integer('session_id').references('id').inTable('sessions').onDelete('SET NULL').nullable();
    t.integer('paid_by').references('id').inTable('users');
    t.decimal('amount', 10, 2).notNullable();
    t.string('note').nullable();
    t.enum('status', ['pending', 'paid']).defaultTo('paid');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('staff_payments');
};
