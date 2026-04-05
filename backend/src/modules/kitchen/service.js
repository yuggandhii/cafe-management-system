const db = require('../../db');

const createTicket = async (order_id, io) => {
  const order = await db('orders').where({ id: order_id }).first();
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  const lines = await db('order_lines')
    .join('products', 'order_lines.product_id', 'products.id')
    .select('order_lines.*', 'products.name as product_name')
    .where({ order_id });

  return db.transaction(async (trx) => {
    const [ticket] = await trx('kitchen_tickets')
      .insert({ order_id, status: 'to_cook' })
      .returning('*');

    const items = await trx('kitchen_ticket_items')
      .insert(
        lines.map((l) => ({
          ticket_id: ticket.id,
          product_name: l.product_name,
          qty: l.quantity,
          note: l.note,
        }))
      )
      .returning('*');

    const ticketWithItems = { ...ticket, items, order_number: order.order_number, table_id: order.table_id };

    // Emit to kitchen
    if (io) {
      io.to(`kitchen_${order.session_id}`).emit('kitchen:new_ticket', ticketWithItems);
    }

    // Update order status
    await trx('orders').where({ id: order_id }).update({ status: 'sent_to_kitchen', updated_at: new Date() });

    return ticketWithItems;
  });
};

const getTickets = (session_id, status) => {
  let q = db('kitchen_tickets')
    .join('orders', 'kitchen_tickets.order_id', 'orders.id')
    .leftJoin('tables', 'orders.table_id', 'tables.id')
    .select(
      'kitchen_tickets.*',
      'orders.order_number',
      'tables.table_number'
    )
    .where('orders.session_id', session_id)
    .orderBy('kitchen_tickets.created_at');

  if (status) q = q.where('kitchen_tickets.status', status);
  return q;
};

const getTicketWithItems = async (id) => {
  const ticket = await db('kitchen_tickets')
    .join('orders', 'kitchen_tickets.order_id', 'orders.id')
    .leftJoin('tables', 'orders.table_id', 'tables.id')
    .select('kitchen_tickets.*', 'orders.order_number', 'tables.table_number')
    .where('kitchen_tickets.id', id)
    .first();

  if (!ticket) return null;
  const items = await db('kitchen_ticket_items').where({ ticket_id: id });
  return { ...ticket, items };
};

const updateTicketStatus = async (id, status, io) => {
  const [ticket] = await db('kitchen_tickets')
    .where({ id })
    .update({ status, updated_at: new Date() })
    .returning('*');

  const order = await db('orders').where({ id: ticket.order_id }).first();
  if (io && order) {
    io.to(`kitchen_${order.session_id}`).emit('kitchen:ticket_updated', { id, status });
    io.to(`session_${order.session_id}`).emit('kitchen:ticket_updated', { id, status, order_id: ticket.order_id });
  }
  return ticket;
};

const toggleItem = async (item_id, is_prepared, io) => {
  const [item] = await db('kitchen_ticket_items')
    .where({ id: item_id })
    .update({ is_prepared, updated_at: new Date() })
    .returning('*');

  const ticket = await db('kitchen_tickets').where({ id: item.ticket_id }).first();
  const order = await db('orders').where({ id: ticket.order_id }).first();

  if (io && order) {
    io.to(`kitchen_${order.session_id}`).emit('kitchen:item_toggled', { item_id, is_prepared });
  }
  return item;
};

module.exports = { createTicket, getTickets, getTicketWithItems, updateTicketStatus, toggleItem };
