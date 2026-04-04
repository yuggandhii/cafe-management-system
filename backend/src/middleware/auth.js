const jwt = require('jsonwebtoken');
const { unauthorized, forbidden } = require('../utils/response');

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    next();
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token');
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return forbidden(res, 'Access denied');
  }
  next();
};

module.exports = { requireAuth, requireRole };
