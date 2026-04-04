const router = require('express').Router();
const service = require('./service');
const { ok } = require('../../utils/response');

router.post('/send-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });
    return ok(res, await service.sendOtp(phone));
  } catch (err) { next(err); }
});

router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    return ok(res, await service.verifyOtp(phone, otp));
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

module.exports = router;
