require('dotenv').config();
const { server } = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  logger.info(`íº€ POS Cafe server running on port ${PORT}`);
});
