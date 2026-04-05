require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./modules/auth/routes');
const posConfigRoutes = require('./modules/posConfig/routes');
const sessionRoutes = require('./modules/sessions/routes');
const floorRoutes = require('./modules/floors/routes');
const productRoutes = require('./modules/products/routes');
const categoryRoutes = require('./modules/categories/routes');
const customerRoutes = require('./modules/customers/routes');
const orderRoutes = require('./modules/orders/routes');
const paymentRoutes = require('./modules/payments/routes');
const kitchenRoutes = require('./modules/kitchen/routes');
const reportRoutes = require('./modules/reports/routes');
const selfOrderRoutes = require('./modules/selfOrder/routes');

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Socket.io rooms
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join:session', (session_id) => {
    socket.join(`session_${session_id}`);
    logger.debug(`Socket ${socket.id} joined session_${session_id}`);
  });

  socket.on('join:kitchen', (session_id) => {
    socket.join(`kitchen_${session_id}`);
    logger.debug(`Socket ${socket.id} joined kitchen_${session_id}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Inject io into every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/pos-configs', posConfigRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/self-order', selfOrderRoutes); // Public — no auth required

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`🚀 POS Cafe server running on port ${PORT}`);
  logger.info(`🔗 Health: http://localhost:${PORT}/health`);
});

module.exports = { app, server, io };
