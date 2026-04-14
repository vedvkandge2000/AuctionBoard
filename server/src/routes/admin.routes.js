const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  listPendingMemberships, approveMembership, rejectMembership,
  listPendingPlayers, approvePlayer, rejectPlayer,
  listApprovedOwners,
} = require('../controllers/admin.controller');

const router = express.Router();

router.use(protect, requireRole('admin'));

// Auction membership approvals (replaces old per-user approvals)
router.get('/memberships', listPendingMemberships);
router.post('/memberships/:membershipId/approve', approveMembership);
router.post('/memberships/:membershipId/reject', rejectMembership);

// Approved owners (for team assignment dropdowns)
router.get('/approved-owners', listApprovedOwners);

// Player pool approvals
router.get('/pending-players', listPendingPlayers);
router.post('/players/:registrationId/approve', approvePlayer);
router.post('/players/:registrationId/reject', rejectPlayer);

module.exports = router;
