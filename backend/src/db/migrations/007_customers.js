exports.up = function(knex) {
  return knex.schema.createTable('customers', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('email').nullable();
    t.string('phone').nullable();
    t.string('street1').nullable();
    t.string('street2').nullable();
    t.string('city').nullable();
    t.string('state').nullable();
    t.string('country').defaultTo('India');
    t.decimal('total_sales', 12, 2).defaultTo(0);
    t.integer('visit_count').defaultTo(1);
    t.timestamp('last_visit').defaultTo(knex.fn.now());
    t.timestamps(true, true);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('customers');
};
