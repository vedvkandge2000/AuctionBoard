require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { PORT } = require('./src/config/env');
const initSocket = require('./src/config/socket');
const seedSportTemplates = require('./src/seeds/sportTemplates');

const server = http.createServer(app);

// Socket.io setup
initSocket(server);

connectDB()
  .then(async () => {
    await seedSportTemplates();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });