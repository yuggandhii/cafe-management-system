const db = require('../../db');

const getAll = () =>
  db('sessions')
    .join('pos_configs', 'sessions.pos_config_id', 'pos_configs.id')
    .join('users', 'sessions.opened_by', 'users.id')
    .select(
      'sessions.*',
      'pos_configs.name as config_name',
      'users.name as opened_by_name'
    )
    .orderBy('sessions.opened_at', 'desc');

const getById = (id) =>
  db('sessions')
    .join('pos_configs', 'sessions.pos_config_id', 'pos_configs.id')
    .join('users', 'sessions.opened_by', 'users.id')
    .select(
      'sessions.*',
      'pos_configs.name as config_name',
      'users.name as opened_by_name'
    )
    .where('sessions.id', id)
    .first();

const getActiveByConfig = (pos_config_id) =>
  db('sessions').where({ pos_config_id, status: 'open' }).first();

const openSession = async (pos_config_id, opened_by) => {
  const existing = await getActiveByConfig(pos_config_id);
  if (existing) {
    const err = new Error('A session is already open for this terminal');
    err.status = 409;
    throw err;
  }

  return db.transaction(async (trx) => {
    const [session] = await trx('sessions')
      .insert({ pos_config_id, opened_by, status: 'open', opened_at: new Date() })
      .returning('*');

    await trx('pos_configs')
      .where({ id: pos_config_id })
      .update({ last_session_id: session.id, updated_at: new Date() });

    return session;
  });
};

const closeSession = async (id, closedBy) => {
  const session = await db('sessions').where({ id }).first();
  if (!session) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }
  if (session.status === 'closed') {
    const err = new Error('Session already closed');
    err.status = 400;
    throw err;
  }

  const [updated] = await db('sessions')
    .where({ id })
    .update({ status: 'closed', closed_at: new Date(), updated_at: new Date() })
    .returning('*');

  return updated;
};

module.exports = { getAll, getById, getActiveByConfig, openSession, closeSession };
