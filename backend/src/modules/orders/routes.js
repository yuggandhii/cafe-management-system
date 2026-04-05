const express = require('express');
const { authenticate } = require('../../middleware/auth');
const service = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.session_id) filters.session_id = req.query.session_id;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.table_id) filters.table_id = req.query.table_id;
    sendSuccess(res, 200, 'Orders', await service.getAll(filters));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await service.getById(req.params.id);
    if (!order) return sendError(res, 404, 'Order not found');
    sendSuccess(res, 200, 'Order', order);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    sendSuccess(res, 201, 'Order created', await service.create(req.body));
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Order updated', await service.update(req.params.id, req.body));
  } catch (err) { next(err); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return sendError(res, 400, 'Status required');
    const order = await service.updateStatus(req.params.id, status);
    // Emit socket event
    req.io?.to(`session_${order.session_id}`).emit('order:status_changed', order);
    sendSuccess(res, 200, 'Status updated', order);
  } catch (err) { next(err); }
});

// Order lines
router.post('/:id/lines', async (req, res, next) => {
  try {
    const line = await service.addLine(req.params.id, req.body);
    sendSuccess(res, 201, 'Line added', line);
  } catch (err) { next(err); }
});

router.put('/:id/lines/:line_id', async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Line updated', await service.updateLine(req.params.line_id, req.body));
  } catch (err) { next(err); }
});

router.delete('/:id/lines/:line_id', async (req, res, next) => {
  try {
    await service.removeLine(req.params.line_id);
    sendSuccess(res, 200, 'Line removed');
  } catch (err) { next(err); }
});

module.exports = router;
