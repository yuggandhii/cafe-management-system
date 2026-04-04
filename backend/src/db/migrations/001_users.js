exports.up = function(knex) {
  return knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('email').unique().notNullable();
    t.string('password_hash').notNullable();
    t.enum('role', ['admin', 'staff', 'kitchen']).defaultTo('staff');
    t.boolean('is_active').defaultTo(true);
    t.string('refresh_token_hash').nullable();
    t.decimal('hourly_rate', 8, 2).defaultTo(0);
    t.timestamps(true, true);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
