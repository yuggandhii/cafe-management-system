const router = require('express').Router();
const svc = require('./service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

// Floors
router.get('/', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.listFloors(req.query.pos_config_id)); } catch (e) { next(e); }
});
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { created(res, await svc.createFloor(req.body)); } catch (e) { next(e); }
});
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { ok(res, await svc.updateFloor(req.params.id, req.body)); } catch (e) { next(e); }
});
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { await svc.deleteFloor(req.params.id); ok(res, null, 'Deleted'); } catch (e) { next(e); }
});

// Tables
router.get('/tables', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.listTables(req.query.floor_id)); } catch (e) { next(e); }
});
router.post('/tables', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { created(res, await svc.createTable(req.body)); } catch (e) { next(e); }
});
router.put('/tables/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { ok(res, await svc.updateTable(req.params.id, req.body)); } catch (e) { next(e); }
});
router.patch('/tables/:id/toggle', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.toggleTable(req.params.id)); } catch (e) { next(e); }
});

module.exports = router;
