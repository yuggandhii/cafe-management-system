exports.up = function (knex) {
  return knex.schema.createTable('self_order_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('table_id').references('id').inTable('tables').onDelete('CASCADE');
    t.uuid('session_id').references('id').inTable('sessions').onDelete('CASCADE');
    t.string('token').unique().notNullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};
exports.down = (knex) => knex.schema.dropTableIfExists('self_order_tokens');
