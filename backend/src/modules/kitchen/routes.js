const express = require('express');
const { authenticate } = require('../../middleware/auth');
const service = require('./service');
const { sendSuccess, sendError } = require('../../utils/response');

const router = express.Router();
router.use(authenticate);

// IMPORTANT: Specific routes BEFORE parameterized /:id routes

// Send order to kitchen (creates ticket)
router.post('/send/:order_id', async (req, res, next) => {
  try {
    const ticket = await service.createTicket(req.params.order_id, req.io);
    sendSuccess(res, 201, 'Sent to kitchen', ticket);
  } catch (err) { next(err); }
});

// Get tickets for a session
router.get('/session/:session_id', async (req, res, next) => {
  try {
    const tickets = await service.getTickets(req.params.session_id, req.query.status);
    // Enrich with items
    const enriched = await Promise.all(
      tickets.map(async (t) => {
        const items = await require('../../db')('kitchen_ticket_items').where({ ticket_id: t.id });
        return { ...t, items };
      })
    );
    sendSuccess(res, 200, 'Kitchen tickets', enriched);
  } catch (err) { next(err); }
});

// Toggle individual item — must come before /:id
router.patch('/items/:item_id/toggle', async (req, res, next) => {
  try {
    const { is_prepared } = req.body;
    const item = await service.toggleItem(req.params.item_id, is_prepared, req.io);
    sendSuccess(res, 200, 'Item toggled', item);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const ticket = await service.getTicketWithItems(req.params.id);
    if (!ticket) return sendError(res, 404, 'Ticket not found');
    sendSuccess(res, 200, 'Ticket', ticket);
  } catch (err) { next(err); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const ticket = await service.updateTicketStatus(req.params.id, status, req.io);
    sendSuccess(res, 200, 'Ticket updated', ticket);
  } catch (err) { next(err); }
});

module.exports = router;
