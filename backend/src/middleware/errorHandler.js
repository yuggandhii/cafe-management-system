const { badRequest, unauthorized, serverError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Zod validation errors
  if (err.name === 'ZodError') {
    const errors = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return badRequest(res, 'Validation failed', errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return unauthorized(res, 'Invalid or expired token');
  }

  // PostgreSQL unique constraint
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'This record already exists' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced record not found' });
  }

  // Custom app errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  return serverError(res, err.message || 'Something went wrong');
};

module.exports = errorHandler;
