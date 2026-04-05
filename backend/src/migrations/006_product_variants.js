exports.up = function (knex) {
  return knex.schema.createTable('product_variants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.string('attribute_name').notNullable();
    t.string('value').notNullable();
    t.string('unit').defaultTo('Piece');
    t.decimal('extra_price', 10, 2).defaultTo(0);
    t.timestamps(true, true);
  });
};
exports.down = (knex) => knex.schema.dropTableIfExists('product_variants');
