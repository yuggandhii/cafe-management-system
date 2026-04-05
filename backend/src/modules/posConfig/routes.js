const router = require('express').Router();
const svc = require('./service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.get('/', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.list()); } catch (e) { next(e); }
});
router.get('/:id', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.getById(req.params.id)); } catch (e) { next(e); }
});
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { created(res, await svc.create(req.body)); } catch (e) { next(e); }
});
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { ok(res, await svc.update(req.params.id, req.body)); } catch (e) { next(e); }
});

module.exports = router;
