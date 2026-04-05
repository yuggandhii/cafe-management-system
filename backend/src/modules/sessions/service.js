const db = require('../../db');
const { v4: uuidv4 } = require('uuid');

const openSession = async ({ pos_config_id, user_id, opening_cash = 0 }) => {
  // Close any existing open sessions for this config
  await db('sessions').where({ pos_config_id, status: 'open' }).update({ status: 'closed', closed_at: new Date() });
  const [session] = await db('sessions').insert({
    id: uuidv4(), pos_config_id, opened_by: user_id, opening_cash, status: 'open',
  }).returning('*');
  await db('pos_configs').where({ id: pos_config_id }).update({ last_session_id: session.id });
  return session;
};

const closeSession = async ({ id, user_id, closing_cash = 0 }) => {
  const [session] = await db('sessions').where({ id }).update({ status: 'closed', closed_at: new Date(), closing_cash }).returning('*');
  return session;
};

const getActiveSession = (pos_config_id) =>
  db('sessions').where({ pos_config_id, status: 'open' }).orderBy('opened_at', 'desc').first();

const getById = (id) =>
  db('sessions as s').join('users as u', 's.opened_by', 'u.id')
    .where('s.id', id)
    .select('s.*', 'u.name as opened_by_name')
    .first();

const list = (pos_config_id) =>
  db('sessions').where({ pos_config_id }).orderBy('opened_at', 'desc');

const listAllActive = () =>
  db('sessions as s')
    .join('pos_configs as p', 's.pos_config_id', 'p.id')
    .where('s.status', 'open')
    .select('s.*', 'p.name as config_name')
    .orderBy('s.opened_at', 'desc');

module.exports = { openSession, closeSession, getActiveSession, getById, list, listAllActive };
