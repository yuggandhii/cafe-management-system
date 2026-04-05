const db = require('../../db');
const { v4: uuidv4 } = require('uuid');

const listFloors = (pos_config_id) => db('floors').where({ pos_config_id }).orderBy('sequence');
const createFloor = async ({ name, pos_config_id }) => {
  const [row] = await db('floors').insert({ id: uuidv4(), name, pos_config_id }).returning('*');
  return row;
};
const updateFloor = async (id, data) => {
  const [row] = await db('floors').where({ id }).update({ ...data, updated_at: new Date() }).returning('*');
  return row;
};
const deleteFloor = (id) => db('floors').where({ id }).del();

const listTables = (floor_id) => db('tables').where({ floor_id }).orderBy('table_number');
const createTable = async ({ floor_id, table_number, seats = 4, appointment_resource }) => {
  const token = `tbl-${uuidv4().slice(0, 8)}`;
  const [row] = await db('tables').insert({ id: uuidv4(), floor_id, table_number, seats, qr_token: token, appointment_resource }).returning('*');
  return row;
};
const updateTable = async (id, data) => {
  const [row] = await db('tables').where({ id }).update({ ...data, updated_at: new Date() }).returning('*');
  return row;
};
const toggleTable = async (id) => {
  const tbl = await db('tables').where({ id }).first();
  const [row] = await db('tables').where({ id }).update({ active: !tbl.active }).returning('*');
  return row;
};

module.exports = { listFloors, createFloor, updateFloor, deleteFloor, listTables, createTable, updateTable, toggleTable };
