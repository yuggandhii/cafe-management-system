const express = require('express');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const service = require('./service');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/summary', async (req, res, next) => {
  try {
    const { session_id, from, to } = req.query;
    const data = await service.getSummary({ session_id, from, to });
    sendSuccess(res, 200, 'Report summary', data);
  } catch (err) { next(err); }
});

module.exports = router;
