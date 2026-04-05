const router = require('express').Router();
const svc = require('./service');
const { requireAuth } = require('../../middleware/auth');
const { ok } = require('../../utils/response');

router.post('/send/:order_id', requireAuth, async (req, res, next) => {
  try {
    const io = req.app.get('io');
    ok(res, await svc.sendToKitchen(req.params.order_id, io));
  } catch (e) { next(e); }
});
router.patch('/tickets/:id/status', async (req, res, next) => {
  try {
    const io = req.app.get('io');
    ok(res, await svc.updateTicketStatus(req.params.id, req.body.status, io));
  } catch (e) { next(e); }
});
router.patch('/items/:id/prepare', async (req, res, next) => {
  try {
    const io = req.app.get('io');
    ok(res, await svc.markItemPrepared(req.params.id, io));
  } catch (e) { next(e); }
});
router.get('/tickets', async (req, res, next) => {
  try { ok(res, await svc.listTickets(req.query)); } catch (e) { next(e); }
});

module.exports = router;
