const db = require('../../db');

const getAll = () => db('product_categories').orderBy('sequence');

const getById = (id) => db('product_categories').where({ id }).first();

const create = (data) => db('product_categories').insert(data).returning('*').then((r) => r[0]);

const update = (id, data) =>
  db('product_categories').where({ id }).update({ ...data, updated_at: new Date() }).returning('*').then((r) => r[0]);

const remove = (id) => db('product_categories').where({ id }).del();

const resequence = async (items) => {
  // items: [{ id, sequence }]
  await Promise.all(
    items.map(({ id, sequence }) =>
      db('product_categories').where({ id }).update({ sequence, updated_at: new Date() })
    )
  );
};

module.exports = { getAll, getById, create, update, remove, resequence };
