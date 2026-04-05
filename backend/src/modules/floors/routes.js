const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const service = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

const router = express.Router();
router.use(authenticate);

// IMPORTANT: Specific routes BEFORE parameterized /:id routes

// Tables sub-resource — all tables (must be before /:id)
router.get('/tables/all', async (req, res, next) => {
  try {
    const tables = await service.getAllTablesWithFloor();
    sendSuccess(res, 200, 'All tables', tables);
  } catch (err) { next(err); }
});

router.put('/tables/:id', requireAdmin, async (req, res, next) => {
  try {
    const table = await service.updateTable(req.params.id, req.body);
    sendSuccess(res, 200, 'Table updated', table);
  } catch (err) { next(err); }
});

router.delete('/tables/:id', requireAdmin, async (req, res, next) => {
  try {
    await service.removeTable(req.params.id);
    sendSuccess(res, 200, 'Table deleted');
  } catch (err) { next(err); }
});

// Floors CRUD
router.get('/', async (req, res, next) => {
  try {
    const floors = await service.getAll();
    sendSuccess(res, 200, 'Floors', floors);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const floor = await service.getById(req.params.id);
    if (!floor) return sendError(res, 404, 'Floor not found');
    sendSuccess(res, 200, 'Floor', floor);
  } catch (err) { next(err); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const floor = await service.create(req.body);
    sendSuccess(res, 201, 'Floor created', floor);
  } catch (err) { next(err); }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const floor = await service.update(req.params.id, req.body);
    sendSuccess(res, 200, 'Floor updated', floor);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    sendSuccess(res, 200, 'Floor deleted');
  } catch (err) { next(err); }
});

// Floor-specific tables
router.get('/:floor_id/tables', async (req, res, next) => {
  try {
    const tables = await service.getTablesByFloor(req.params.floor_id);
    sendSuccess(res, 200, 'Tables', tables);
  } catch (err) { next(err); }
});

router.post('/:floor_id/tables', requireAdmin, async (req, res, next) => {
  try {
    const qr_token = uuidv4();
    const table = await service.createTable({
      ...req.body,
      floor_id: req.params.floor_id,
      qr_token,
    });
    sendSuccess(res, 201, 'Table created', table);
  } catch (err) { next(err); }
});

module.exports = router;
