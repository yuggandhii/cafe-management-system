const db = require('../../db');

const list = async () => {
  return db('floors').select('*').orderBy('sequence', 'asc');
};

const create = async ({ name, pos_config_id }) => {
  const [floor] = await db('floors')
    .insert({ name, pos_config_id })
    .returning('*');
  return floor;
};

const update = async (id, { name, sequence, is_active }) => {
  const [floor] = await db('floors')
    .where({ id })
    .update({ name, sequence, is_active, updated_at: db.fn.now() })
    .returning('*');
  if (!floor) {
    const err = new Error('Floor not found');
    err.statusCode = 404;
    throw err;
  }
  return floor;
};

const remove = async (id) => {
  const deleted = await db('floors').where({ id }).delete();
  if (!deleted) {
    const err = new Error('Floor not found');
    err.statusCode = 404;
    throw err;
  }
};

module.exports = { list, create, update, remove };
