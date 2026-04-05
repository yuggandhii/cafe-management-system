exports.up = async function (knex) {
  await knex.schema.createTable('floors', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.uuid('pos_config_id').references('id').inTable('pos_configs').onDelete('CASCADE');
    t.integer('sequence').defaultTo(1);
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.schema.createTable('tables', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('floor_id').notNullable().references('id').inTable('floors').onDelete('CASCADE');
    t.string('table_number').notNullable();
    t.integer('seats').defaultTo(4);
    t.boolean('active').defaultTo(true);
    t.string('qr_token').unique().nullable();
    t.string('appointment_resource').nullable();
    t.timestamps(true, true);
  });
};
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('tables');
  await knex.schema.dropTableIfExists('floors');
};
