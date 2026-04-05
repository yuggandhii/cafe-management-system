require('dotenv').config();
const { Client } = require('pg');

async function createDb() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = 'pos_cafe'`);
    if (res.rowCount === 0) {
      console.log('Creating pos_cafe database...');
      await client.query('CREATE DATABASE pos_cafe');
      console.log('Database pos_cafe created successfully.');
    } else {
      console.log('Database pos_cafe already exists.');
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
  } finally {
    await client.end();
  }
}

createDb();
