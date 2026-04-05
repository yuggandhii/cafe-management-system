const express = require('express');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const service = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Categories', await service.getAll());
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const cat = await service.getById(req.params.id);
    if (!cat) return sendError(res, 404, 'Category not found');
    sendSuccess(res, 200, 'Category', cat);
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    sendSuccess(res, 201, 'Category created', await service.create(req.body));
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Category updated', await service.update(req.params.id, req.body));
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    sendSuccess(res, 200, 'Category deleted');
  } catch (err) { next(err); }
});

router.post('/resequence', requireAdmin, async (req, res, next) => {
  try {
    await service.resequence(req.body.items);
    sendSuccess(res, 200, 'Resequenced');
  } catch (err) { next(err); }
});

module.exports = router;
