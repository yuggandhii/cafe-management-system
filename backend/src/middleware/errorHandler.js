const logger = require('../utils/logger');
const { sendError } = require('../utils/response');

/**
 * Global error handler middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    stack: err.stack,
    body: req.body,
  });

  if (err.code === '23505') {
    return sendError(res, 409, 'Duplicate entry — record already exists');
  }

  if (err.code === '23503') {
    return sendError(res, 400, 'Referenced record does not exist');
  }

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return sendError(res, status, message);
};

module.exports = { errorHandler };
