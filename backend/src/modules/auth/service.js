const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../../db');

const signAccessToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' });

const signRefreshToken = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' });

const signup = async ({ name, email, password, role, phone }) => {
  const existingUser = await db('users').where({ email }).first();
  if (existingUser) {
    const error = new Error('User already exists');
    error.status = 400;
    throw error;
  }
  const password_hash = await bcrypt.hash(password, 12);
  const [user] = await db('users').insert({ id: uuidv4(), name, email, password_hash, role }).returning('*');
  
  if (phone) {
    await db('customers').insert({
      id: uuidv4(),
      name,
      email,
      phone
    }).onConflict('email').ignore(); // ignore if customer email exists
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await db('users').where({ id: user.id }).update({ refresh_token_hash: refreshHash });
  return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

const login = async ({ email, password }) => {
  const user = await db('users').where({ email }).first();
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await db('users').where({ id: user.id }).update({ refresh_token_hash: refreshHash });
  return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    const err = new Error('No refresh token'); err.statusCode = 401; throw err;
  }
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid refresh token'); err.statusCode = 401; throw err;
  }
  const user = await db('users').where({ id: payload.id }).first();
  if (!user || !user.refresh_token_hash) {
    const err = new Error('Session expired'); err.statusCode = 401; throw err;
  }
  const valid = await bcrypt.compare(refreshToken, user.refresh_token_hash);
  if (!valid) {
    const err = new Error('Invalid session'); err.statusCode = 401; throw err;
  }
  const accessToken = signAccessToken(user);
  return { accessToken };
};

const logout = async (userId) => {
  await db('users').where({ id: userId }).update({ refresh_token_hash: null });
};

module.exports = { signup, login, refresh, logout };
