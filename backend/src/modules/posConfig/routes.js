const express = require('express');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { posConfigSchema } = require('./validation');
const service = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const configs = await service.getAll();
    sendSuccess(res, 200, 'POS configs', configs);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const config = await service.getById(req.params.id);
    if (!config) return sendError(res, 404, 'POS config not found');
    sendSuccess(res, 200, 'POS config', config);
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, validate(posConfigSchema), async (req, res, next) => {
  try {
    const config = await service.create(req.body);
    sendSuccess(res, 201, 'POS config created', config);
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, validate(posConfigSchema), async (req, res, next) => {
  try {
    const config = await service.update(req.params.id, req.body);
    if (!config) return sendError(res, 404, 'POS config not found');
    sendSuccess(res, 200, 'POS config updated', config);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    sendSuccess(res, 200, 'POS config deleted');
  } catch (err) { next(err); }
});

module.exports = router;
