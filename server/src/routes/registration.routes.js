const express = require('express');
const { registerTeamOwner, registerPlayer, applyToAuction, getMyRegistrations, listOpenAuctions } = require('../controllers/registration.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

// Public — no auth required
router.get('/auctions', listOpenAuctions);
router.post('/team-owner', registerTeamOwner);
router.post('/player', registerPlayer);

// Protected — player account required
router.post('/player/apply', protect, requireRole('player'), applyToAuction);
router.get('/player/my-registrations', protect, requireRole('player'), getMyRegistrations);

module.exports = router;
