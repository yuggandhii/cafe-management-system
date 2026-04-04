const router = require('express').Router();
const service = require('./service');
const { requireAuth } = require('../../middleware/auth');
const { validate, validateQuery } = require('../../middleware/validate');
const { ok, created } = require('../../utils/response');
const { updateTicketStatusSchema, paginationSchema } = require('../validation/schemas');

router.use(requireAuth);

router.get('/tickets', validateQuery(paginationSchema), async (req, res, next) => {
  try { return ok(res, await service.listTickets(req.query)); }
  catch (err) { next(err); }
});

router.post('/send/:order_id', async (req, res, next) => {
  try { const io = req.app.get('io'); return created(res, await service.sendToKitchen(req.params.order_id, io), 'Sent to kitchen'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

router.patch('/tickets/:id/status', validate(updateTicketStatusSchema), async (req, res, next) => {
  try { const io = req.app.get('io'); return ok(res, await service.updateTicketStatus(req.params.id, req.body.status, io), 'Status updated'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

router.patch('/items/:id/prepare', async (req, res, next) => {
  try { const io = req.app.get('io'); return ok(res, await service.markItemPrepared(req.params.id, io), 'Item toggled'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

module.exports = router;
