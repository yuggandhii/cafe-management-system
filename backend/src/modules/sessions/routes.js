const express = require('express');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const service = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const sessions = await service.getAll();
    sendSuccess(res, 200, 'Sessions', sessions);
  } catch (err) { next(err); }
});

// IMPORTANT: Specific routes MUST come before parameterized /:id routes
router.get('/config/:config_id/active', async (req, res, next) => {
  try {
    const session = await service.getActiveByConfig(req.params.config_id);
    sendSuccess(res, 200, 'Active session', session || null);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const session = await service.getById(req.params.id);
    if (!session) return sendError(res, 404, 'Session not found');
    sendSuccess(res, 200, 'Session', session);
  } catch (err) { next(err); }
});

router.post('/open', async (req, res, next) => {
  try {
    const { pos_config_id } = req.body;
    if (!pos_config_id) return sendError(res, 400, 'pos_config_id required');
    const session = await service.openSession(pos_config_id, req.user.id);
    sendSuccess(res, 201, 'Session opened', session);
  } catch (err) { next(err); }
});

router.post('/:id/close', async (req, res, next) => {
  try {
    const session = await service.closeSession(req.params.id, req.user.id);
    sendSuccess(res, 200, 'Session closed', session);
  } catch (err) { next(err); }
});

module.exports = router;
