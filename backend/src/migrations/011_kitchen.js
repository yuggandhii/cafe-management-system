exports.up = async function (knex) {
  await knex.schema.createTable('kitchen_tickets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('order_id').notNullable().unique().references('id').inTable('orders').onDelete('CASCADE');
    t.enu('status', ['to_cook', 'preparing', 'completed']).defaultTo('to_cook');
    t.timestamp('sent_at').defaultTo(knex.fn.now());
    t.timestamp('completed_at').nullable();
  });
  await knex.schema.createTable('kitchen_ticket_items', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('ticket_id').notNullable().references('id').inTable('kitchen_tickets').onDelete('CASCADE');
    t.uuid('order_line_id').nullable().references('id').inTable('order_lines').onDelete('SET NULL');
    t.string('product_name').notNullable();
    t.decimal('quantity', 10, 2).defaultTo(1);
    t.boolean('is_prepared').defaultTo(false);
  });
};
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('kitchen_ticket_items');
  await knex.schema.dropTableIfExists('kitchen_tickets');
};
