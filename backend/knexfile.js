require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'pos_cafe',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    // Optimized pool for 500 concurrent users
    pool: {
      min: 5,
      max: 30,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
    migrations: { directory: './src/migrations' },
    seeds: { directory: './src/seeds' },
    // Performance tweaks
    asyncStackTraces: false,
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 5, max: 30 },
    migrations: { directory: './src/migrations' },
    seeds: { directory: './src/seeds' },
  },
};
