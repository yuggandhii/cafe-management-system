exports.up = async function(knex) {
  await knex.schema
    .createTable('customer_otps', (t) => {
      t.increments('id').primary();
      t.string('phone').notNullable();
      t.string('otp', 6).notNullable();
      t.boolean('verified').defaultTo(false);
      t.timestamp('expires_at').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('customer_sessions', (t) => {
      t.increments('id').primary();
      t.integer('customer_id').references('id').inTable('customers').onDelete('CASCADE');
      t.string('phone').notNullable();
      t.string('token').unique().notNullable();
      t.timestamp('expires_at').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });

  // Performance indexes for scalability
  await knex.schema.raw('CREATE INDEX idx_orders_session_id ON orders(session_id)');
  await knex.schema.raw('CREATE INDEX idx_orders_status ON orders(status)');
  await knex.schema.raw('CREATE INDEX idx_orders_created_at ON orders(created_at)');
  await knex.schema.raw('CREATE INDEX idx_order_lines_order_id ON order_lines(order_id)');
  await knex.schema.raw('CREATE INDEX idx_kitchen_tickets_status ON kitchen_tickets(status)');
  await knex.schema.raw('CREATE INDEX idx_payments_order_id ON payments(order_id)');
  await knex.schema.raw('CREATE INDEX idx_payments_status ON payments(status)');
  await knex.schema.raw('CREATE INDEX idx_tables_qr_token ON tables(qr_token)');
  await knex.schema.raw('CREATE INDEX idx_customers_phone ON customers(phone)');
  await knex.schema.raw('CREATE INDEX idx_sessions_pos_config_id ON sessions(pos_config_id)');
  await knex.schema.raw('CREATE INDEX idx_sessions_status ON sessions(status)');
  await knex.schema.raw('CREATE INDEX idx_products_category_id ON products(category_id)');
  await knex.schema.raw('CREATE INDEX idx_products_is_active ON products(is_active)');
};

exports.down = async function(knex) {
  await knex.schema.dropTable('customer_sessions');
  await knex.schema.dropTable('customer_otps');
};
