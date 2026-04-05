exports.up = async function (knex) {
  await knex.schema.createTable('product_categories', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.string('color').defaultTo('#E6F1FB');
    t.integer('sequence').defaultTo(1);
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.schema.createTable('products', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.uuid('category_id').references('id').inTable('product_categories').onDelete('SET NULL');
    t.decimal('price', 10, 2).notNullable().defaultTo(0);
    t.decimal('tax_percent', 5, 2).defaultTo(5);
    t.string('unit_of_measure').defaultTo('Piece');
    t.text('description').nullable();
    t.string('image_url').nullable();
    t.boolean('is_active').defaultTo(true);
    t.boolean('send_to_kitchen').defaultTo(true);
    t.timestamps(true, true);
  });
};
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('product_categories');
};
