const db = require('../../db');
const { v4: uuidv4 } = require('uuid');

const list = () => db('pos_configs').orderBy('created_at', 'desc');

const getById = (id) => db('pos_configs').where({ id }).first();

const create = async ({ name }) => {
  const [row] = await db('pos_configs').insert({ id: uuidv4(), name }).returning('*');
  return row;
};

const update = async (id, data) => {
  const allowed = ['name', 'enable_cash', 'enable_digital', 'enable_upi', 'upi_id'];
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  const [row] = await db('pos_configs').where({ id }).update({ ...filtered, updated_at: new Date() }).returning('*');
  return row;
};

module.exports = { list, getById, create, update };
