const { sendError } = require('../utils/response');

/**
 * Validates request body against a Zod schema
 * @param {import('zod').ZodSchema} schema
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 422, 'Validation failed', errors);
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
