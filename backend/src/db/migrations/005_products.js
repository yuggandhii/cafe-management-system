exports.up = function(knex) {
  return knex.schema
    .createTable('product_categories', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.string('color').defaultTo('#6366f1');
      t.integer('sequence').defaultTo(1);
      t.timestamps(true, true);
    })
    .createTable('products', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.integer('category_id').references('id').inTable('product_categories').onDelete('SET NULL').nullable();
      t.decimal('price', 10, 2).notNullable();
      t.decimal('tax_percent', 5, 2).defaultTo(0);
      t.string('unit_of_measure').defaultTo('Unit');
      t.text('description').nullable();
      t.boolean('is_active').defaultTo(true);
      t.timestamps(true, true);
    });
};
exports.down = function(knex) {
  return knex.schema.dropTable('products').dropTable('product_categories');
};
