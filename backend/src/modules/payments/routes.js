const express = require('express');
const { authenticate } = require('../../middleware/auth');
const service = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.method) filters.method = req.query.method;
    if (req.query.session_id) filters.session_id = req.query.session_id;
    sendSuccess(res, 200, 'Payments', await service.getAll(filters));
  } catch (err) { next(err); }
});

router.get('/order/:order_id', async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Payments', await service.getByOrder(req.params.order_id));
  } catch (err) { next(err); }
});

router.post('/process', async (req, res, next) => {
  try {
    const { order_id, method, amount } = req.body;
    if (!order_id || !method || !amount) return sendError(res, 400, 'order_id, method, amount required');
    const payment = await service.processPayment(order_id, method, parseFloat(amount), req.io);
    sendSuccess(res, 201, 'Payment processed', payment);
  } catch (err) { next(err); }
});

router.get('/upi-qr/:order_id', async (req, res, next) => {
  try {
    const db = require('../../db');
    const order = await db('orders').where({ id: req.params.order_id }).first();
    if (!order) return sendError(res, 404, 'Order not found');

    const config = await db('pos_configs')
      .join('sessions', 'pos_configs.id', 'sessions.pos_config_id')
      .where('sessions.id', order.session_id)
      .select('pos_configs.upi_id')
      .first();

    if (!config?.upi_id) return sendError(res, 400, 'UPI not configured');

    const qr = await service.generateUpiQr(config.upi_id, order.total, order.order_number);
    sendSuccess(res, 200, 'UPI QR', { qr, upi_id: config.upi_id, amount: order.total });
  } catch (err) { next(err); }
});

module.exports = router;
