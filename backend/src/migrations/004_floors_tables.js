/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('floors', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.integer('sequence').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('tables', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('floor_id').notNullable().references('id').inTable('floors').onDelete('CASCADE');
    table.string('table_number').notNullable();
    table.integer('seats').notNullable().defaultTo(4);
    table.boolean('active').notNullable().defaultTo(true);
    table.string('qr_token').nullable().unique();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('tables');
  await knex.schema.dropTableIfExists('floors');
};
