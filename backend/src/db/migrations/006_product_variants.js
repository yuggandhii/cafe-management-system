exports.up = function(knex) {
  return knex.schema.createTable('product_variants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('product_id').references('id').inTable('products').onDelete('CASCADE');
    t.string('attribute_name').notNullable();
    t.string('value').notNullable();
    t.string('unit').nullable();
    t.decimal('extra_price', 10, 2).defaultTo(0);
    t.timestamps(true, true);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('product_variants');
};
