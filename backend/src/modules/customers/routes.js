const router = require('express').Router();
const svc = require('./service');
const { requireAuth } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.get('/states', requireAuth, (req, res) => ok(res, svc.getStates()));
router.get('/', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.list(req.query)); } catch (e) { next(e); }
});
router.get('/:id', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.getById(req.params.id)); } catch (e) { next(e); }
});
router.post('/', requireAuth, async (req, res, next) => {
  try { created(res, await svc.create(req.body)); } catch (e) { next(e); }
});
router.put('/:id', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.update(req.params.id, req.body)); } catch (e) { next(e); }
});

module.exports = router;
