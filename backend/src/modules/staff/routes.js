const router = require('express').Router();
const service = require('./service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.use(requireAuth);

router.get('/', requireRole('admin'), async (req, res, next) => {
  try { return ok(res, await service.getAllStaff()); }
  catch (err) { next(err); }
});

router.get('/summary', requireRole('admin'), async (req, res, next) => {
  try { return ok(res, await service.getStaffSummary()); }
  catch (err) { next(err); }
});

router.get('/shifts', requireRole('admin'), async (req, res, next) => {
  try { return ok(res, await service.getShifts(req.query)); }
  catch (err) { next(err); }
});

router.get('/payments', requireRole('admin'), async (req, res, next) => {
  try { return ok(res, await service.getStaffPayments(req.query)); }
  catch (err) { next(err); }
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

// Payroll: auto-compute earnings for a staff member
router.get('/payroll/:staff_id', requireRole('admin'), async (req, res, next) => {
  try { return ok(res, await service.computePayroll({ staff_id: req.params.staff_id, ...req.query })); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

// Attendance
router.get('/attendance/today', requireRole('admin'), async (req, res, next) => {
  try { return ok(res, await service.getTodayAttendance()); }
  catch (err) { next(err); }
});

router.get('/attendance/summary', requireRole('admin'), async (req, res, next) => {
  try { return ok(res, await service.getAttendanceSummary()); }
  catch (err) { next(err); }
});

// Admin clocks in a staff member
router.post('/attendance/clock-in', requireRole('admin'), async (req, res, next) => {
  try { return created(res, await service.clockIn(req.body.staff_id), 'Clocked in'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

// Admin clocks out a staff member
router.post('/attendance/clock-out', requireRole('admin'), async (req, res, next) => {
  try { return ok(res, await service.clockOut(req.body.staff_id), 'Clocked out'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

// Self clock-in (any authenticated staff)
router.post('/attendance/self/clock-in', async (req, res, next) => {
  try { return created(res, await service.clockIn(req.user.id), 'Clocked in successfully'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

// Self clock-out
router.post('/attendance/self/clock-out', async (req, res, next) => {
  try { return ok(res, await service.clockOut(req.user.id), 'Clocked out successfully'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

module.exports = router;

