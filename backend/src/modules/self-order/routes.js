const router = require('express').Router();
const service = require('./service');
const { ok, created } = require('../../utils/response');

// Public routes — no auth required
router.get('/:token', async (req, res, next) => {
  try {
    return ok(res, await service.getByToken(req.params.token));
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.post('/:token/order', async (req, res, next) => {
  try {
    return created(res, await service.placeOrder(req.params.token, req.body), 'Order placed');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.get('/:token/status', async (req, res, next) => {
  try {
    const { customer_token } = req.query;
    return ok(res, await service.getOrderStatus(req.params.token, customer_token));
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

module.exports = router;
