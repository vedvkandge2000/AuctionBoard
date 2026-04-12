const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  listPendingUsers, approveUser, rejectUser,
  listPendingPlayers, approvePlayer, rejectPlayer,
  listApprovedOwners,
} = require('../controllers/admin.controller');

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/pending-users', listPendingUsers);
router.get('/approved-owners', listApprovedOwners);
router.post('/users/:userId/approve', approveUser);
router.post('/users/:userId/reject', rejectUser);

router.get('/pending-players', listPendingPlayers);
router.post('/players/:registrationId/approve', approvePlayer);
router.post('/players/:registrationId/reject', rejectPlayer);

module.exports = router;
