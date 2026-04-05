exports.up = function (knex) {
  return knex.schema.createTable('sessions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('pos_config_id').notNullable().references('id').inTable('pos_configs').onDelete('CASCADE');
    t.uuid('opened_by').notNullable().references('id').inTable('users');
    t.timestamp('opened_at').defaultTo(knex.fn.now());
    t.timestamp('closed_at').nullable();
    t.decimal('opening_cash', 10, 2).defaultTo(0);
    t.decimal('closing_cash', 10, 2).nullable();
    t.enu('status', ['open', 'closed']).defaultTo('open');
    t.timestamps(true, true);
  });
};
exports.down = (knex) => knex.schema.dropTableIfExists('sessions');
