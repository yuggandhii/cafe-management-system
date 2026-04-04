const router = require('express').Router();
const service = require('./service');
const selfOrderService = require('../self-order/service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    return ok(res, await service.list(req.query.floor_id));
  } catch (err) { next(err); }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    return created(res, await service.create(req.body), 'Table created');
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    return ok(res, await service.update(req.params.id, req.body), 'Table updated');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.patch('/:id/toggle', requireRole('admin'), async (req, res, next) => {
  try {
    return ok(res, await service.toggleActive(req.params.id), 'Table status toggled');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.post('/:id/generate-token', async (req, res, next) => {
  try {
    const { session_id } = req.body;
    const token = await selfOrderService.generateToken(req.params.id, session_id);
    return created(res, token, 'Self-order token generated');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

module.exports = router;
