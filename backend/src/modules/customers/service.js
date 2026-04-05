const db = require('../../db');
const { v4: uuidv4 } = require('uuid');

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh'];

const list = async ({ search, page = 1, limit = 20 } = {}) => {
  let q = db('customers').orderBy('name');
  if (search) q = q.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`).orWhereILike('phone', `%${search}%`);
  return q.limit(limit).offset((page - 1) * limit);
};
const getById = (id) => db('customers').where({ id }).first();
const create = async (data) => {
  const [row] = await db('customers').insert({ id: uuidv4(), ...data }).returning('*');
  return row;
};
const update = async (id, data) => {
  const [row] = await db('customers').where({ id }).update({ ...data, updated_at: new Date() }).returning('*');
  return row;
};
const getStates = () => STATES;

module.exports = { list, getById, create, update, getStates };
