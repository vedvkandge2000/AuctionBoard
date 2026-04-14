const express = require('express');
const { register, login, me, getMyTeam, updateMe, changePassword, deleteMe, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.get('/me/team', protect, getMyTeam);
router.patch('/me', protect, updateMe);
router.post('/me/change-password', protect, changePassword);
router.delete('/me', protect, deleteMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
