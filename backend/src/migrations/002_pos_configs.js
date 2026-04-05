/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('pos_configs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.boolean('enable_cash').notNullable().defaultTo(true);
    table.boolean('enable_digital').notNullable().defaultTo(false);
    table.boolean('enable_upi').notNullable().defaultTo(false);
    table.string('upi_id').nullable();
    table.uuid('last_session_id').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pos_configs');
};
