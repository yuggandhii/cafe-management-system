/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('pos_config_id').notNullable().references('id').inTable('pos_configs').onDelete('CASCADE');
    table.uuid('opened_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('opened_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('closed_at').nullable();
    table.enum('status', ['open', 'closed']).notNullable().defaultTo('open');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sessions');
};
