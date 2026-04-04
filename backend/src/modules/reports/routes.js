const router = require('express').Router();
const service = require('./service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { ok } = require('../../utils/response');

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', async (req, res, next) => {
  try {
    return ok(res, await service.getDashboard(req.query));
  } catch (err) { next(err); }
});

router.get('/sales-chart', async (req, res, next) => {
  try {
    return ok(res, await service.getSalesChart(req.query));
  } catch (err) { next(err); }
});

router.get('/top-categories', async (req, res, next) => {
  try {
    return ok(res, await service.getTopCategories(req.query));
  } catch (err) { next(err); }
});

router.get('/top-products', async (req, res, next) => {
  try {
    return ok(res, await service.getTopProducts(req.query));
  } catch (err) { next(err); }
});

router.get('/top-orders', async (req, res, next) => {
  try {
    return ok(res, await service.getTopOrders(req.query));
  } catch (err) { next(err); }
});
router.get('/hourly-heatmap', async (req, res, next) => {
  try { return ok(res, await service.getHourlyHeatmap(req.query)); } catch (err) { next(err); }
});

router.get('/customer-retention', async (req, res, next) => {
  try { return ok(res, await service.getCustomerRetention()); } catch (err) { next(err); }
});

router.get('/staff-performance', async (req, res, next) => {
  try { return ok(res, await service.getStaffPerformance()); } catch (err) { next(err); }
});

router.get('/table-revenue', async (req, res, next) => {
  try { return ok(res, await service.getTableRevenue()); } catch (err) { next(err); }
});
module.exports = router;
