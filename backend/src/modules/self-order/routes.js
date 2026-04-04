const router = require('express').Router();
const service = require('./service');
const { ok } = require('../../utils/response');

router.get('/:token', async (req, res, next) => {
  try {
    const data = await service.getByToken(req.params.token);
    return ok(res, data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

module.exports = router;
