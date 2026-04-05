const db = require('../../db');
const { v4: uuidv4 } = require('uuid');

const sendToKitchen = async (order_id, io) => {
  const order = await db('orders').where({ id: order_id }).first();
  if (!order) { const e = new Error('Order not found'); e.statusCode = 404; throw e; }

  // Check if ticket already exists
  const existing = await db('kitchen_tickets').where({ order_id }).first();
  if (existing) {
    // Update existing ticket items with latest order lines
    await db('kitchen_ticket_items').where({ ticket_id: existing.id }).del();
  }

  const ticket_id = existing ? existing.id : uuidv4();

  if (!existing) {
    await db('kitchen_tickets').insert({ id: ticket_id, order_id, status: 'to_cook' });
  } else {
    await db('kitchen_tickets').where({ id: ticket_id }).update({ status: 'to_cook', sent_at: new Date() });
  }

  const lines = await db('order_lines as ol')
    .join('products as p', 'ol.product_id', 'p.id')
    .select('ol.id as line_id', 'p.name as product_name', 'ol.quantity', 'p.send_to_kitchen')
    .where('ol.order_id', order_id)
    .where('p.send_to_kitchen', true);

  const items = lines.map(l => ({
    id: uuidv4(), ticket_id, order_line_id: l.line_id,
    product_name: l.product_name, quantity: l.quantity, is_prepared: false,
  }));

  if (items.length > 0) await db('kitchen_ticket_items').insert(items);

  const ticket = await getTicketById(ticket_id);

  // Emit to kitchen room
  if (io) {
    const session = await db('sessions').where({ id: order.session_id }).first();
    io.to(`kitchen_${order.session_id}`).emit('new_ticket', ticket);
    io.emit('order_sent_kitchen', { order_id, ticket });
  }

  return ticket;
};

const getTicketById = async (id) => {
  const ticket = await db('kitchen_tickets as kt')
    .join('orders as o', 'kt.order_id', 'o.id')
    .leftJoin('tables as t', 'o.table_id', 't.id')
    .select('kt.*', 'o.order_number', 'o.notes', 't.table_number')
    .where('kt.id', id).first();
  if (!ticket) return null;
  const items = await db('kitchen_ticket_items').where({ ticket_id: id });
  return { ...ticket, items };
};

const updateTicketStatus = async (ticket_id, status, io) => {
  const valid = ['to_cook', 'preparing', 'completed'];
  if (!valid.includes(status)) { const e = new Error('Invalid status'); e.statusCode = 400; throw e; }
  const updates = { status };
  if (status === 'completed') updates.completed_at = new Date();
  const [ticket] = await db('kitchen_tickets').where({ id: ticket_id }).update(updates).returning('*');
  const full = await getTicketById(ticket_id);
  if (io) io.emit('ticket_updated', full);
  return full;
};

const markItemPrepared = async (item_id, io) => {
  const item = await db('kitchen_ticket_items').where({ id: item_id }).first();
  const [updated] = await db('kitchen_ticket_items').where({ id: item_id }).update({ is_prepared: !item.is_prepared }).returning('*');
  if (io) io.emit('item_prepared', { item_id, is_prepared: updated.is_prepared, ticket_id: item.ticket_id });
  return updated;
};

const listTickets = async ({ session_id, status } = {}) => {
  let q = db('kitchen_tickets as kt')
    .join('orders as o', 'kt.order_id', 'o.id')
    .leftJoin('tables as t', 'o.table_id', 't.id')
    .select('kt.*', 'o.order_number', 'o.session_id', 'o.notes', 't.table_number')
    .orderBy('kt.sent_at', 'asc');
  if (session_id) q = q.where('o.session_id', session_id);
  if (status) q = q.where('kt.status', status);
  const tickets = await q;
  return Promise.all(tickets.map(async (tk) => {
    const items = await db('kitchen_ticket_items').where({ ticket_id: tk.id });
    return { ...tk, items };
  }));
};

module.exports = { sendToKitchen, updateTicketStatus, markItemPrepared, listTickets, getTicketById };
