const router = require('express').Router();
const authService = require('./service');
const { signupSchema, loginSchema } = require('./validation');
const { requireAuth } = require('../../middleware/auth');
const { ok, created, badRequest } = require('../../utils/response');

const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 };

router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const user = await authService.signup(data);
    created(res, user, 'Account created successfully');
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.login(data);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    ok(res, { accessToken, user });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const { accessToken } = await authService.refresh(refreshToken);
    ok(res, { accessToken });
  } catch (err) { next(err); }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.clearCookie('refreshToken');
    ok(res, null, 'Logged out');
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, (req, res) => ok(res, req.user));

module.exports = router;
