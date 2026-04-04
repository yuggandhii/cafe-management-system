exports.up = function(knex) {
  return knex.schema.createTable('customers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name').notNullable();
    t.string('email').nullable();
    t.string('phone').nullable();
    t.string('street1').nullable();
    t.string('street2').nullable();
    t.string('city').nullable();
    t.string('state').nullable();
    t.string('country').defaultTo('India');
    t.decimal('total_sales', 12, 2).defaultTo(0);
    t.timestamps(true, true);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('customers');
};
