const db = require('../../db');

const list = async () => {
  return db('product_categories').select('*').orderBy('sequence', 'asc');
};

const create = async ({ name, color = '#6366f1', sequence }) => {
  const maxSeq = await db('product_categories').max('sequence as max').first();
  const [cat] = await db('product_categories')
    .insert({ name, color, sequence: sequence || (maxSeq.max || 0) + 1 })
    .returning('*');
  return cat;
};

const update = async (id, { name, color, sequence }) => {
  const [cat] = await db('product_categories')
    .where({ id })
    .update({ name, color, sequence, updated_at: db.fn.now() })
    .returning('*');
  if (!cat) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  return cat;
};

const resequence = async (items) => {
  await Promise.all(
    items.map(({ id, sequence }) =>
      db('product_categories').where({ id }).update({ sequence })
    )
  );
  return list();
};

const remove = async (id) => {
  const deleted = await db('product_categories').where({ id }).delete();
  if (!deleted) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
};

module.exports = { list, create, update, resequence, remove };
