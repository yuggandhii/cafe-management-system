const db = require('../../db');

const getAll = () => db('pos_configs').orderBy('created_at');

const getById = (id) => db('pos_configs').where({ id }).first();

const create = (data) => db('pos_configs').insert(data).returning('*').then((r) => r[0]);

const update = (id, data) =>
  db('pos_configs').where({ id }).update({ ...data, updated_at: new Date() }).returning('*').then((r) => r[0]);

const remove = (id) => db('pos_configs').where({ id }).del();

module.exports = { getAll, getById, create, update, remove };
