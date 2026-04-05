const express = require('express');
const { authenticate } = require('../../middleware/auth');
const service = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const customers = await service.getAll({ search: req.query.search });
    sendSuccess(res, 200, 'Customers', customers);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const c = await service.getById(req.params.id);
    if (!c) return sendError(res, 404, 'Customer not found');
    sendSuccess(res, 200, 'Customer', c);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    sendSuccess(res, 201, 'Customer created', await service.create(req.body));
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Customer updated', await service.update(req.params.id, req.body));
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    sendSuccess(res, 200, 'Customer deleted');
  } catch (err) { next(err); }
});

module.exports = router;
