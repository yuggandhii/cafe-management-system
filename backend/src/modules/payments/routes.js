const router = require('express').Router();
const service = require('./service');
const { requireAuth } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    return ok(res, await service.list(req.query));
  } catch (err) { next(err); }
});

router.get('/upi-qr/:order_id', async (req, res, next) => {
  try {
    return ok(res, await service.generateUpiQr(req.params.order_id));
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    return created(res, await service.createPayment(req.body), 'Payment created');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.post('/:id/validate', async (req, res, next) => {
  try {
    return ok(res, await service.validatePayment(req.params.id), 'Payment confirmed');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

module.exports = router;
