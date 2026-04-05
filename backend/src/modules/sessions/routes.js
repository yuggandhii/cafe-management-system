const router = require('express').Router();
const svc = require('./service');
const { requireAuth } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.post('/open', requireAuth, async (req, res, next) => {
  try { created(res, await svc.openSession({ ...req.body, user_id: req.user.id })); } catch (e) { next(e); }
});
router.post('/:id/close', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.closeSession({ id: req.params.id, user_id: req.user.id, ...req.body })); } catch (e) { next(e); }
});
router.get('/active/:pos_config_id', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.getActiveSession(req.params.pos_config_id)); } catch (e) { next(e); }
});
router.get('/active-all/list', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.listAllActive()); } catch (e) { next(e); }
});
router.get('/:id', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.getById(req.params.id)); } catch (e) { next(e); }
});
router.get('/config/:pos_config_id', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.list(req.params.pos_config_id)); } catch (e) { next(e); }
});

module.exports = router;
