/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('product_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('color').notNullable().defaultTo('#4A90E2');
    table.integer('sequence').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.uuid('category_id').nullable().references('id').inTable('product_categories').onDelete('SET NULL');
    table.decimal('price', 10, 2).notNullable().defaultTo(0);
    table.decimal('tax_percent', 5, 2).notNullable().defaultTo(5);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('sequence').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('product_categories');
};
