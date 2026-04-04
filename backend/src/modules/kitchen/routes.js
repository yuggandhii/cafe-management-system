const router = require('express').Router();
const service = require('./service');
const { requireAuth } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.use(requireAuth);

router.get('/tickets', async (req, res, next) => {
  try {
    return ok(res, await service.listTickets(req.query));
  } catch (err) { next(err); }
});

router.post('/send/:order_id', async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const ticket = await service.sendToKitchen(req.params.order_id, io);
    return created(res, ticket, 'Order sent to kitchen');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.patch('/tickets/:id/status', async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const ticket = await service.updateTicketStatus(req.params.id, req.body.status, io);
    return ok(res, ticket, 'Ticket status updated');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

router.patch('/items/:id/prepare', async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const item = await service.markItemPrepared(req.params.id, io);
    return ok(res, item, 'Item preparation toggled');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

module.exports = router;
