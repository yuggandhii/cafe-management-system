exports.up = function(knex) {
  return knex.schema.createTable('order_lines', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('order_id').references('id').inTable('orders').onDelete('CASCADE');
    t.uuid('product_id').references('id').inTable('products').onDelete('SET NULL').nullable();
    t.uuid('variant_id').references('id').inTable('product_variants').onDelete('SET NULL').nullable();
    t.decimal('quantity', 10, 2).defaultTo(1);
    t.decimal('unit_price', 10, 2).notNullable();
    t.decimal('tax_percent', 5, 2).defaultTo(0);
    t.decimal('subtotal', 10, 2).notNullable();
    t.decimal('total', 10, 2).notNullable();
    t.text('notes').nullable();
    t.timestamps(true, true);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('order_lines');
};
