exports.up = function(knex) {
  return knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.string('email').unique().notNullable();
    t.string('password_hash').notNullable();
    t.enum('role', ['admin', 'staff', 'kitchen']).defaultTo('staff');
    t.boolean('is_active').defaultTo(true);
    t.string('refresh_token_hash').nullable();
    t.timestamps(true, true);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
