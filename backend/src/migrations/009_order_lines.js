exports.up = function (knex) {
  return knex.schema.createTable('order_lines', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('RESTRICT');
    t.uuid('variant_id').nullable().references('id').inTable('product_variants').onDelete('SET NULL');
    t.decimal('quantity', 10, 2).defaultTo(1);
    t.decimal('unit_price', 10, 2).notNullable();
    t.decimal('tax_percent', 5, 2).defaultTo(5);
    t.decimal('subtotal', 10, 2).defaultTo(0);
    t.decimal('total', 10, 2).defaultTo(0);
    t.text('notes').nullable();
    t.timestamps(true, true);
  });
};
exports.down = (knex) => knex.schema.dropTableIfExists('order_lines');
