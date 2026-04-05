const router = require('express').Router();
const svc = require('./service');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { ok, created } = require('../../utils/response');

// ── Public routes (no auth) ─────────────────────────────────────────────────
router.get('/public/categories', async (req, res, next) => {
  try { ok(res, await svc.listCategories()); } catch (e) { next(e); }
});
router.get('/public/menu', async (req, res, next) => {
  try { ok(res, await svc.listProducts({ is_active: true, limit: 200 })); } catch (e) { next(e); }
});

// Categories
router.get('/categories', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.listCategories()); } catch (e) { next(e); }
});
router.post('/categories', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { created(res, await svc.createCategory(req.body)); } catch (e) { next(e); }
});
router.put('/categories/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { ok(res, await svc.updateCategory(req.params.id, req.body)); } catch (e) { next(e); }
});
router.delete('/categories/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { await svc.deleteCategory(req.params.id); ok(res, null, 'Deleted'); } catch (e) { next(e); }
});

// Products
router.get('/', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.listProducts(req.query)); } catch (e) { next(e); }
});
router.get('/:id', requireAuth, async (req, res, next) => {
  try { ok(res, await svc.getProductById(req.params.id)); } catch (e) { next(e); }
});
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { created(res, await svc.createProduct(req.body)); } catch (e) { next(e); }
});
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { ok(res, await svc.updateProduct(req.params.id, req.body)); } catch (e) { next(e); }
});
router.patch('/:id/toggle', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { ok(res, await svc.toggleProduct(req.params.id)); } catch (e) { next(e); }
});
router.post('/:id/variants', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { created(res, await svc.addVariant(req.params.id, req.body)); } catch (e) { next(e); }
});
router.delete('/variants/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try { await svc.removeVariant(req.params.id); ok(res, null, 'Deleted'); } catch (e) { next(e); }
});

module.exports = router;
