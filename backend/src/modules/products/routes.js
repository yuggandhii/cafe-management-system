const router = require('express').Router();
const service = require('./service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    return ok(res, await service.list(req.query));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    return ok(res, await service.getById(req.params.id));
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    return created(res, await service.create(req.body), 'Product created');
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    return ok(res, await service.update(req.params.id, req.body), 'Product updated');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.patch('/:id/toggle', requireRole('admin'), async (req, res, next) => {
  try {
    return ok(res, await service.toggleActive(req.params.id), 'Product status toggled');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.post('/:id/variants', requireRole('admin'), async (req, res, next) => {
  try {
    return created(res, await service.addVariant(req.params.id, req.body), 'Variant added');
  } catch (err) { next(err); }
});

router.delete('/variants/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await service.removeVariant(req.params.id);
    return ok(res, null, 'Variant removed');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

module.exports = router;
