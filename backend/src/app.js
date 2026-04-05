require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  // Optimized for 500 concurrent socket connections
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
});

// Store io instance on app
app.set('io', io);
module.exports.io = io; // Also export for service-level access

// Middleware
app.use(compression()); // gzip all responses
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Rate limiting - permissive enough for 500 users
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many auth requests' });

// Routes
app.use('/api/auth', authLimiter, require('./modules/auth/routes'));
app.use('/api/pos-configs', require('./modules/posConfig/routes'));
app.use('/api/sessions', require('./modules/sessions/routes'));
app.use('/api/floors', require('./modules/floors/routes'));
app.use('/api/products', require('./modules/products/routes'));
app.use('/api/customers', require('./modules/customers/routes'));
app.use('/api/orders', require('./modules/orders/routes'));
app.use('/api/payments', require('./modules/payments/routes'));
app.use('/api/kitchen', require('./modules/kitchen/routes'));
app.use('/api/reports', require('./modules/reports/routes'));
app.use('/api/upload', require('./modules/upload/routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Public: customer display latest order (no auth)
app.get('/api/public/latest-order', async (req, res) => {
  try {
    const db = require('./db');
    const row = await db('orders as o')
      .leftJoin('customers as c', 'o.customer_id', 'c.id')
      .select('o.id', 'o.order_number', 'o.subtotal', 'o.tax_amount', 'o.total',
        'o.status', 'o.customer_id', 'c.name as customer_name', 'o.updated_at')
      .where('o.status', 'draft')
      .orderBy('o.updated_at', 'desc')
      .first();

    if (!row) return res.json({ data: null });

    const lines = await db('order_lines as ol')
      .join('products as p', 'ol.product_id', 'p.id')
      .leftJoin('product_variants as pv', 'ol.variant_id', 'pv.id')
      .select('ol.*', 'p.name as product_name',
        'pv.value as variant_value', 'pv.attribute_name as variant_attr')
      .where('ol.order_id', row.id)
      .orderBy('ol.created_at');

    res.json({ data: { ...row, lines } });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message });
  }
});

// Public: Place order from Table QR code
app.post('/api/public/orders', async (req, res) => {
  try {
    const db = require('./db');
    const { table_id, items, payment_method, notes } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Items are required' });
    }

    const { v4: uuidv4 } = require('uuid');

    // Find first active session, or default to latest config if none open
    let activeSession = await db('sessions').where('status', 'open').first();
    if (!activeSession) {
      // Auto-open session for kiosk/table orders if skipped
      const posConfig = await db('pos_configs').first();
      if (!posConfig) return res.status(400).json({ message: 'No POS Configuration found, cannot process' });
      const defaultUser = await db('users').first() || { id: null };

      const [newSession] = await db('sessions').insert({
        id: uuidv4(),
        pos_config_id: posConfig.id,
        user_id: defaultUser.id,
        status: 'open',
        opening_balance: 0
      }).returning('*');
      activeSession = newSession;
    }

    const maxRow = await db('orders').where({ session_id: activeSession.id }).max('order_number as m').first();
    const order_number = (maxRow.m || 0) + 1;

    // Create Draft Order
    const [order] = await db('orders').insert({
      id: uuidv4(),
      session_id: activeSession.id,
      table_id,
      order_number,
      notes: notes || '',
      status: 'draft' // ensure it passes DB constraints
    }).returning('*');

    let subtotal = 0;
    let tax_amount = 0;

    for (const item of items) {
      const product = await db('products').where('id', item.product_id).first();
      let price = parseFloat(product.price);
      let variant_id = null;
      if (item.variant_id) {
        const variant = await db('product_variants').where('id', item.variant_id).first();
        if (variant) {
          price += parseFloat(variant.extra_price || 0);
          variant_id = variant.id;
        }
      }

      const lineSub = (price * item.quantity);
      subtotal += lineSub;
      tax_amount += lineSub * (parseFloat(product.tax_percent) / 100);

      await db('order_lines').insert({
        id: uuidv4(),
        order_id: order.id,
        product_id: item.product_id,
        variant_id,
        quantity: item.quantity,
        unit_price: price,
        tax_percent: product.tax_percent,
        subtotal: lineSub.toFixed(2),
        total: lineSub.toFixed(2),
        notes: item.notes
      });
    }

    const total = subtotal + tax_amount;
    await db('orders').where('id', order.id).update({
      subtotal: subtotal.toFixed(2),
      tax_amount: tax_amount.toFixed(2),
      total: total.toFixed(2)
    });

    // Mock direct payments if selected (for demo dashboards)
    if (payment_method && payment_method !== 'counter') {
      await db('orders').where({ id: order.id }).update({ status: 'paid' });
      order.status = 'paid';
      await db('payments').insert({
        id: uuidv4(),
        order_id: order.id,
        amount: total.toFixed(2),
        method: payment_method,
        status: 'success'
      });
    }

    req.app.get('io').to(`kitchen_${activeSession.id}`).emit('new_ticket', { order_id: order.id });

    res.json({ data: { message: 'Order sent to kitchen successfully!', order_id: order.id, total: total.toFixed(2) } });
  } catch (e) {
    console.error('[public/orders error]:', e);
    res.status(500).json({ message: 'Failed to place order' });
  }
});

// Public: Get table info 
app.get('/api/public/tables/:id', async (req, res) => {
  try {
    const db = require('./db');
    const table = await db('tables').where('id', req.params.id).first();
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json({ data: table });
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
});

app.get('/api/public/floors', async (req, res) => {
  try {
    const db = require('./db');
    const floors = await db('floors').orderBy('name');
    res.json({ data: floors });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/public/tables', async (req, res) => {
  try {
    const db = require('./db');
    const tables = await db('tables').orderBy('table_number');
    res.json({ data: tables });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join_kitchen', ({ session_id }) => {
    socket.join(`kitchen_${session_id}`);
    console.log(`Socket ${socket.id} joined kitchen_${session_id}`);
  });

  socket.on('join_customer_display', ({ session_id }) => {
    socket.join(`display_${session_id}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`\n🍽️  Cawfee Tawk POS Backend running on http://localhost:${PORT}`);
  console.log(`📡  Socket.io ready`);
  console.log(`🔗  Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});

module.exports = { app, httpServer };
