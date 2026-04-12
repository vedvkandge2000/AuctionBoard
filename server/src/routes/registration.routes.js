const express = require('express');
const { registerTeamOwner, registerPlayer } = require('../controllers/registration.controller');

const router = express.Router();

// Public — no auth required
router.post('/team-owner', registerTeamOwner);
router.post('/player', registerPlayer);

module.exports = router;
