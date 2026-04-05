const jwt = require('jsonwebtoken');
const { unauthorized, forbidden } = require('../utils/response');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token');
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return unauthorized(res);
  if (!roles.includes(req.user.role)) {
    return forbidden(res, 'You do not have permission to perform this action');
  }
  next();
};

module.exports = { requireAuth, requireRole };
