const db = require('../../db');
const crypto = require('crypto');

const generateToken = async (table_id, session_id) => {
  const table = await db('tables').where({ id: table_id }).first();
  if (!table) {
    const err = new Error('Table not found');
    err.statusCode = 404;
    throw err;
  }

  await db('self_order_tokens')
    .where({ table_id, session_id })
    .update({ is_active: false });

  const token = crypto.randomBytes(24).toString('hex');
  const [record] = await db('self_order_tokens')
    .insert({ table_id, session_id, token, is_active: true })
    .returning('*');

  return {
    ...record,
    url: `/s/${token}`,
  };
};

const getByToken = async (token) => {
  const record = await db('self_order_tokens')
    .where({ token, is_active: true })
    .first();
  if (!record) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 404;
    throw err;
  }

  const table = await db('tables').where({ id: record.table_id }).first();
  const session = await db('sessions').where({ id: record.session_id }).first();
  const posConfig = await db('pos_configs').where({ id: session.pos_config_id }).first();

  return { table, session, pos_config: posConfig };
};

module.exports = { generateToken, getByToken };
