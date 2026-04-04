const router = require('express').Router();
const service = require('./service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    return ok(res, await service.list());
  } catch (err) { next(err); }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    return created(res, await service.create(req.body), 'Category created');
  } catch (err) { next(err); }
});

router.put('/resequence', requireRole('admin'), async (req, res, next) => {
  try {
    return ok(res, await service.resequence(req.body.items), 'Resequenced');
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    return ok(res, await service.update(req.params.id, req.body), 'Category updated');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    return ok(res, null, 'Category deleted');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

module.exports = router;
