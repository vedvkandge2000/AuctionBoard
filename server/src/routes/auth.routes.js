const express = require('express');
const { register, login, me, getMyTeam } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.get('/me/team', protect, getMyTeam);

module.exports = router;
