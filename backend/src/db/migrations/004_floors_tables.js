exports.up = function(knex) {
  return knex.schema
    .createTable('floors', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.integer('pos_config_id').references('id').inTable('pos_configs').onDelete('CASCADE');
      t.integer('sequence').defaultTo(1);
      t.boolean('is_active').defaultTo(true);
      t.timestamps(true, true);
    })
    .createTable('tables', (t) => {
      t.increments('id').primary();
      t.integer('floor_id').references('id').inTable('floors').onDelete('CASCADE');
      t.string('table_number').notNullable();
      t.integer('seats').defaultTo(4);
      t.boolean('active').defaultTo(true);
      t.string('qr_token').unique().nullable();
      t.timestamps(true, true);
    });
};
exports.down = function(knex) {
  return knex.schema.dropTable('tables').dropTable('floors');
};
