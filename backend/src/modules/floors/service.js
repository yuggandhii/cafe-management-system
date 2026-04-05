const db = require('../../db');

const getAll = () => db('floors').orderBy('sequence');

const getById = (id) => db('floors').where({ id }).first();

const create = (data) => db('floors').insert(data).returning('*').then((r) => r[0]);

const update = (id, data) =>
  db('floors').where({ id }).update({ ...data, updated_at: new Date() }).returning('*').then((r) => r[0]);

const remove = (id) => db('floors').where({ id }).del();

// Tables sub-resource
const getTablesByFloor = (floor_id) =>
  db('tables').where({ floor_id }).orderBy('table_number');

const getAllTablesWithFloor = () =>
  db('tables')
    .join('floors', 'tables.floor_id', 'floors.id')
    .select('tables.*', 'floors.name as floor_name')
    .orderBy(['floors.sequence', 'tables.table_number']);

const getTableById = (id) => db('tables').where({ id }).first();

const createTable = (data) => db('tables').insert(data).returning('*').then((r) => r[0]);

const updateTable = (id, data) =>
  db('tables').where({ id }).update({ ...data, updated_at: new Date() }).returning('*').then((r) => r[0]);

const removeTable = (id) => db('tables').where({ id }).del();

const getTableByToken = (qr_token) => db('tables').where({ qr_token }).first();

module.exports = {
  getAll, getById, create, update, remove,
  getTablesByFloor, getAllTablesWithFloor, getTableById, createTable, updateTable, removeTable, getTableByToken,
};
