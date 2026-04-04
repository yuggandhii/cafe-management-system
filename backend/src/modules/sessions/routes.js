const router = require('express').Router();
const service = require('./service');
const { requireAuth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { ok, created } = require('../../utils/response');
const { openSessionSchema, closeSessionSchema } = require('../validation/schemas');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try { return ok(res, await service.list()); }
  catch (err) { next(err); }
});

router.get('/active/:pos_config_id', async (req, res, next) => {
  try { return ok(res, await service.getActiveSession(req.params.pos_config_id) || null); }
  catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try { return ok(res, await service.getById(req.params.id)); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

router.post('/open', validate(openSessionSchema), async (req, res, next) => {
  try { return created(res, await service.openSession({ ...req.body, user_id: req.user.id }), 'Session opened'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

router.post('/:id/close', validate(closeSessionSchema), async (req, res, next) => {
  try { return ok(res, await service.closeSession({ id: req.params.id, user_id: req.user.id, ...req.body }), 'Session closed'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

module.exports = router;
