exports.up = function(knex) {
  return knex.schema.createTable('sessions', (t) => {
    t.increments('id').primary();
    t.integer('pos_config_id').references('id').inTable('pos_configs').onDelete('CASCADE');
    t.integer('opened_by').references('id').inTable('users');
    t.timestamp('opened_at').defaultTo(knex.fn.now());
    t.timestamp('closed_at').nullable();
    t.decimal('opening_cash', 10, 2).defaultTo(0);
    t.decimal('closing_cash', 10, 2).nullable();
    t.enum('status', ['open', 'closed']).defaultTo('open');
    t.timestamps(true, true);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('sessions');
};
