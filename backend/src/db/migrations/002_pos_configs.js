exports.up = function(knex) {
  return knex.schema.createTable('pos_configs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.boolean('enable_cash').defaultTo(true);
    t.boolean('enable_digital').defaultTo(false);
    t.boolean('enable_upi').defaultTo(false);
    t.string('upi_id').nullable();
    t.uuid('last_session_id').nullable();
    t.timestamps(true, true);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('pos_configs');
};
