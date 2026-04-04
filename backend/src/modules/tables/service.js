const db = require('../../db');
const crypto = require('crypto');

const list = async (floor_id) => {
  const query = db('tables')
    .select('tables.*', 'floors.name as floor_name')
    .leftJoin('floors', 'tables.floor_id', 'floors.id')
    .orderBy('tables.table_number', 'asc');
  if (floor_id) query.where('tables.floor_id', floor_id);
  return query;
};

const create = async ({ floor_id, table_number, seats }) => {
  const qr_token = crypto.randomBytes(16).toString('hex');
  const [table] = await db('tables')
    .insert({ floor_id, table_number, seats, qr_token })
    .returning('*');
  return table;
};

const update = async (id, { table_number, seats }) => {
  const [table] = await db('tables')
    .where({ id })
    .update({ table_number, seats, updated_at: db.fn.now() })
    .returning('*');
  if (!table) {
    const err = new Error('Table not found');
    err.statusCode = 404;
    throw err;
  }
  return table;
};

const toggleActive = async (id) => {
  const table = await db('tables').where({ id }).first();
  if (!table) {
    const err = new Error('Table not found');
    err.statusCode = 404;
    throw err;
  }
  const [updated] = await db('tables')
    .where({ id })
    .update({ active: !table.active, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

module.exports = { list, create, update, toggleActive };
