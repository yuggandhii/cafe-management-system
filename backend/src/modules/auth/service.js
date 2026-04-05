const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db');

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
  return { accessToken, refreshToken };
};

const signup = async ({ name, email, password, role }) => {
  const existing = await db('users').where({ email }).first();
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [user] = await db('users')
    .insert({ name, email, password_hash, role })
    .returning(['id', 'name', 'email', 'role', 'created_at']);

  const { accessToken, refreshToken } = generateTokens(user);
  const refresh_token_hash = await bcrypt.hash(refreshToken, 8);
  await db('users').where({ id: user.id }).update({ refresh_token_hash });

  return { user, accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await db('users').where({ email }).first();
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const { accessToken, refreshToken } = generateTokens(user);
  const refresh_token_hash = await bcrypt.hash(refreshToken, 8);
  await db('users').where({ id: user.id }).update({ refresh_token_hash });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

const refresh = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  const user = await db('users').where({ id: decoded.id }).first();
  if (!user || !user.refresh_token_hash) {
    const err = new Error('Session revoked');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(refreshToken, user.refresh_token_hash);
  if (!valid) {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
  const refresh_token_hash = await bcrypt.hash(newRefreshToken, 8);
  await db('users').where({ id: user.id }).update({ refresh_token_hash });

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
  await db('users').where({ id: userId }).update({ refresh_token_hash: null });
};

module.exports = { signup, login, refresh, logout };
