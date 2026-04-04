exports.up = function(knex) {
  return knex.schema.createTable('order_lines', (t) => {
    t.increments('id').primary();
    t.integer('order_id').references('id').inTable('orders').onDelete('CASCADE');
    t.integer('product_id').references('id').inTable('products').onDelete('SET NULL').nullable();
    t.integer('variant_id').references('id').inTable('product_variants').onDelete('SET NULL').nullable();
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
