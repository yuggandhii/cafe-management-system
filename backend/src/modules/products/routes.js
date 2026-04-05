const express = require('express');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const service = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.category_id) filters.category_id = req.query.category_id;
    if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';
    sendSuccess(res, 200, 'Products', await service.getAll(filters));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await service.getWithVariants(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');
    sendSuccess(res, 200, 'Product', product);
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    sendSuccess(res, 201, 'Product created', await service.create(req.body));
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Product updated', await service.update(req.params.id, req.body));
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    sendSuccess(res, 200, 'Product deleted');
  } catch (err) { next(err); }
});

module.exports = router;
