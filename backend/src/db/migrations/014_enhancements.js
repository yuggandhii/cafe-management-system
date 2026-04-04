exports.up = async function(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.decimal('hourly_rate', 8, 2).defaultTo(0);
  });
  await knex.schema.alterTable('customers', (t) => {
    t.integer('visit_count').defaultTo(1);
    t.timestamp('last_visit').defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('customer_otps', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('phone').notNullable();
    t.string('otp', 6).notNullable();
    t.boolean('verified').defaultTo(false);
    t.timestamp('expires_at').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('customer_sessions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('customer_id').references('id').inTable('customers').onDelete('CASCADE');
    t.string('phone').notNullable();
    t.string('token').unique().notNullable();
    t.timestamp('expires_at').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTable('customer_sessions');
  await knex.schema.dropTable('customer_otps');
  await knex.schema.alterTable('customers', (t) => {
    t.dropColumn('visit_count');
    t.dropColumn('last_visit');
  });
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('hourly_rate');
  });
};
