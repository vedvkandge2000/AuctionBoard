const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { CLIENT_URL, NODE_ENV } = require('./config/env');
const errorMiddleware = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const auctionRoutes = require('./routes/auction.routes');
const playerRoutes = require('./routes/player.routes');
const teamRoutes = require('./routes/team.routes');
const uploadRoutes = require('./routes/upload.routes');
const registrationRoutes = require('./routes/registration.routes');
const adminRoutes = require('./routes/admin.routes');
const membershipRoutes = require('./routes/membership.routes');
const sportTemplateRoutes = require('./routes/sportTemplate.routes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
if (NODE_ENV !== 'test') app.use(morgan('dev'));

// Serve locally uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/register', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/auctions/:id/players', playerRoutes);
app.use('/api/auctions/:id/teams', teamRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sport-templates', sportTemplateRoutes);

// In production: serve the built React app for all non-API routes
if (NODE_ENV !== 'development') {
  const distPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Dev: Vite runs separately; return JSON 404 for unmatched routes
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });
}

// Centralised error handler
app.use(errorMiddleware);

module.exports = app;