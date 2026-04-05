exports.up = function (knex) {
  return knex.schema.createTable('pos_configs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.boolean('enable_cash').defaultTo(true);
    t.boolean('enable_digital').defaultTo(true);
    t.boolean('enable_upi').defaultTo(true);
    t.string('upi_id').defaultTo('cafe@ybl');
    t.uuid('last_session_id').nullable();
    t.timestamps(true, true);
  });
};
exports.down = (knex) => knex.schema.dropTableIfExists('pos_configs');
