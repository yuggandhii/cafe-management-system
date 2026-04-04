exports.up = function(knex) {
  return knex.schema
    .createTable('kitchen_tickets', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.uuid('order_id').references('id').inTable('orders').onDelete('CASCADE').unique();
      t.enum('status', ['to_cook', 'preparing', 'completed']).defaultTo('to_cook');
      t.timestamp('sent_at').defaultTo(knex.fn.now());
      t.timestamp('completed_at').nullable();
    })
    .createTable('kitchen_ticket_items', (t) => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.uuid('ticket_id').references('id').inTable('kitchen_tickets').onDelete('CASCADE');
      t.uuid('order_line_id').references('id').inTable('order_lines').onDelete('CASCADE');
      t.string('product_name').notNullable();
      t.decimal('quantity', 10, 2).notNullable();
      t.boolean('is_prepared').defaultTo(false);
    });
};
exports.down = function(knex) {
  return knex.schema.dropTable('kitchen_ticket_items').dropTable('kitchen_tickets');
};
