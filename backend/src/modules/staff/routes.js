const router = require('express').Router();
const service = require('./service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.use(requireAuth);

router.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    return ok(res, await service.getAllStaff());
  } catch (err) { next(err); }
});

router.get('/summary', requireRole('admin'), async (req, res, next) => {
  try {
    return ok(res, await service.getStaffSummary());
  } catch (err) { next(err); }
});

router.get('/shifts', requireRole('admin'), async (req, res, next) => {
  try {
    return ok(res, await service.getShifts(req.query));
  } catch (err) { next(err); }
});

router.get('/payments', requireRole('admin'), async (req, res, next) => {
  try {
    return ok(res, await service.getStaffPayments(req.query));
  } catch (err) { next(err); }
});

router.post('/pay', requireRole('admin'), async (req, res, next) => {
  try {
    const payment = await service.payStaff({ ...req.body, paid_by: req.user.id });
    return created(res, payment, 'Staff payment recorded');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

module.exports = router;
