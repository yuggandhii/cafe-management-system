exports.up = function (knex) {
  return knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.string('email').unique().notNullable();
    t.string('password_hash').notNullable();
    t.enu('role', ['admin', 'staff', 'kitchen']).defaultTo('staff');
    t.boolean('is_active').defaultTo(true);
    t.text('refresh_token_hash').nullable();
    t.timestamps(true, true);
  });
};
exports.down = (knex) => knex.schema.dropTableIfExists('users');
