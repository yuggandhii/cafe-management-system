const express = require('express');
const service = require('./service');
const kitchenService = require('../kitchen/service');
const { sendSuccess, sendError } = require('../../utils/response');

const router = express.Router();
// NOTE: No authenticate middleware — these are PUBLIC routes for customers

/**
 * GET /api/self-order/table/:qr_token
 * Validate QR code, return menu context
 */
router.get('/table/:qr_token', async (req, res, next) => {
  try {
    const ctx = await service.getTableContext(req.params.qr_token);
    sendSuccess(res, 200, 'Table context', ctx);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/self-order/table/:qr_token/order
 * Place a new order or add to existing draft
 * Body: { items: [{ product_id, quantity, note? }], customer_name? }
 */
router.post('/table/:qr_token/order', async (req, res, next) => {
  try {
    const { items, customer_name } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, 'items array is required');
    }

    const { order, lines } = await service.placeOrder(req.params.qr_token, {
      items,
      customer_name,
    });

    // Automatically send to kitchen
    try {
      await kitchenService.createTicket(order.id, req.io);
    } catch (kitchenErr) {
      // Kitchen ticket may already exist (if merging with existing order) — that's fine
    }

    sendSuccess(res, 201, 'Order placed', {
      order_id: order.id,
      order_number: order.order_number,
      total: order.total,
      status: order.status,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/self-order/order/:order_id
 * Public order status tracking
 */
router.get('/order/:order_id', async (req, res, next) => {
  try {
    const order = await service.getOrderStatus(req.params.order_id);
    sendSuccess(res, 200, 'Order status', order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
