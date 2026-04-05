/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('kitchen_tickets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.enum('status', ['to_cook', 'preparing', 'completed']).notNullable().defaultTo('to_cook');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('kitchen_ticket_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('ticket_id').notNullable().references('id').inTable('kitchen_tickets').onDelete('CASCADE');
    table.string('product_name').notNullable();
    table.integer('qty').notNullable().defaultTo(1);
    table.boolean('is_prepared').notNullable().defaultTo(false);
    table.text('note').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('kitchen_ticket_items');
  await knex.schema.dropTableIfExists('kitchen_tickets');
};
