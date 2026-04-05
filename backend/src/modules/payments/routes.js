const router = require('express').Router();
const svc = require('./service');
const { requireAuth } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.post('/', requireAuth, async (req, res, next) => {
  try { created(res, await svc.createPayment(req.body)); } catch (e) { next(e); }
});
router.post('/:id/validate', requireAuth, async (req, res, next) => {
  try {
    const io = req.app.get('io');
    ok(res, await svc.validatePayment(req.params.id, io));
  } catch (e) { next(e); }
});
router.get('/upi-qr/:order_id', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.generateUpiQr(req.params.order_id)); } catch (e) { next(e); }
});
router.get('/', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.listPayments(req.query)); } catch (e) { next(e); }
});

module.exports = router;
