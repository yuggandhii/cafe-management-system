const router = require('express').Router();
const svc = require('./service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { ok } = require('../../utils/response');

router.get('/dashboard', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { ok(res, await svc.getDashboard(req.query)); } catch (e) { next(e); }
});
router.get('/sales-chart', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { ok(res, await svc.getSalesChart(req.query)); } catch (e) { next(e); }
});
router.get('/top-categories', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { ok(res, await svc.getTopCategories(req.query)); } catch (e) { next(e); }
});
router.get('/top-products', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { ok(res, await svc.getTopProducts(req.query)); } catch (e) { next(e); }
});
router.get('/top-orders', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { ok(res, await svc.getTopOrders(req.query)); } catch (e) { next(e); }
});

module.exports = router;
