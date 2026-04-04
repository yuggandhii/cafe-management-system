exports.up = function(knex) {
  return knex.schema.createTable('self_order_tokens', (t) => {
    t.increments('id').primary();
    t.integer('table_id').references('id').inTable('tables').onDelete('CASCADE');
    t.integer('session_id').references('id').inTable('sessions').onDelete('CASCADE');
    t.string('token').unique().notNullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('self_order_tokens');
};
