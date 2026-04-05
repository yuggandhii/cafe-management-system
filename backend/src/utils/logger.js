/**
 * Simple console logger with timestamps
 */
const logger = {
  info: (msg, meta = {}) => {
    console.log(`[${new Date().toISOString()}] INFO: ${msg}`, Object.keys(meta).length ? meta : '');
  },
  warn: (msg, meta = {}) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${msg}`, Object.keys(meta).length ? meta : '');
  },
  error: (msg, meta = {}) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, Object.keys(meta).length ? meta : '');
  },
  debug: (msg, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] DEBUG: ${msg}`, Object.keys(meta).length ? meta : '');
    }
  },
};

module.exports = logger;
