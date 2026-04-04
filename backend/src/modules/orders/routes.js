const router = require('express').Router();
const service = require('./service');
const { requireAuth } = require('../../middleware/auth');
const { validate, validateQuery } = require('../../middleware/validate');
const { ok, created } = require('../../utils/response');
const { createOrderSchema, addOrderLineSchema, updateOrderLineSchema, paginationSchema } = require('../validation/schemas');

router.use(requireAuth);

router.get('/', validateQuery(paginationSchema), async (req, res, next) => {
  try { return ok(res, await service.list(req.query)); }
  catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try { return ok(res, await service.getById(req.params.id)); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

router.post('/', validate(createOrderSchema), async (req, res, next) => {
  try { return created(res, await service.create({ ...req.body, created_by: req.user.id }), 'Order created'); }
  catch (err) { next(err); }
});

router.post('/:id/lines', validate(addOrderLineSchema), async (req, res, next) => {
  try { return created(res, await service.addLine(req.params.id, req.body), 'Line added'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

router.put('/:id/lines/:line_id', validate(updateOrderLineSchema), async (req, res, next) => {
  try { return ok(res, await service.updateLine(req.params.line_id, req.body), 'Line updated'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

router.delete('/:id/lines/:line_id', async (req, res, next) => {
  try { await service.removeLine(req.params.line_id); return ok(res, null, 'Line removed'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

router.patch('/:id/customer', async (req, res, next) => {
  try { return ok(res, await service.setCustomer(req.params.id, req.body.customer_id), 'Customer set'); }
  catch (err) { next(err); }
});

router.post('/:id/archive', async (req, res, next) => {
  try { return ok(res, await service.archive(req.params.id), 'Order archived'); }
  catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try { await service.remove(req.params.id); return ok(res, null, 'Order deleted'); }
  catch (err) { if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message }); next(err); }
});

module.exports = router;
