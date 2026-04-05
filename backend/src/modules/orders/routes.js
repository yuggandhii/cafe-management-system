const router = require('express').Router();
const svc = require('./service');
const { requireAuth } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

router.get('/', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.listOrders(req.query)); } catch (e) { next(e); }
});
router.post('/', requireAuth, async (req, res, next) => {
  try { created(res, await svc.createOrder({ ...req.body, created_by: req.user.id })); } catch (e) { next(e); }
});
router.get('/:id', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.getOrderById(req.params.id)); } catch (e) { next(e); }
});
router.post('/:id/lines', requireAuth, async (req, res, next) => {
  try { created(res, await svc.addLine(req.params.id, req.body)); } catch (e) { next(e); }
});
router.put('/:id/lines/:line_id', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.updateLine(req.params.line_id, req.body)); } catch (e) { next(e); }
});
router.delete('/:id/lines/:line_id', requireAuth, async (req, res, next) => {
  try { await svc.removeLine(req.params.line_id); ok(res, null, 'Deleted'); } catch (e) { next(e); }
});
router.patch('/:id/customer', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.setCustomer(req.params.id, req.body.customer_id)); } catch (e) { next(e); }
});
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.updateOrderStatus(req.params.id, req.body.status)); } catch (e) { next(e); }
});
router.delete('/:id', requireAuth, async (req, res, next) => {
  try { await svc.deleteOrder(req.params.id); ok(res, null, 'Deleted'); } catch (e) { next(e); }
});

module.exports = router;
