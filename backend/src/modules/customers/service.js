const db = require('../../db');

const getAll = ({ search, page = 1, limit = 50 } = {}) => {
  let q = db('customers').orderBy('name');
  if (search) q = q.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`).orWhereILike('phone', `%${search}%`);
  return q.limit(limit).offset((page - 1) * limit);
};

const getById = (id) => db('customers').where({ id }).first();

const create = (data) => db('customers').insert(data).returning('*').then((r) => r[0]);

const update = (id, data) =>
  db('customers').where({ id }).update({ ...data, updated_at: new Date() }).returning('*').then((r) => r[0]);

const remove = (id) => db('customers').where({ id }).del();

module.exports = { getAll, getById, create, update, remove };
