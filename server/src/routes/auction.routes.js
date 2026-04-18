const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  createAuction, getAuction, listAuctions, browseAuctions, updateConfig, deleteAuction, getOrder, setOrder, getReport, getReportRecipients, shareReport,
} = require('../controllers/auction.controller');
const {
  start, pause, resume, end, nextPlayer, sold, unsold, overrideBid, advanceRound, setOfflineBid, releasePlayer, reverseBid,
} = require('../controllers/auctionFlow.controller');
const {
  createRequest, listRequests, approveRequest, rejectRequest,
} = require('../controllers/releaseRequest.controller');

const router = express.Router();

router.get('/', protect, listAuctions);
router.get('/browse', protect, browseAuctions); // must be before /:id
router.post('/', protect, requireRole('admin'), createAuction);
router.get('/:id', protect, getAuction);
router.patch('/:id/config', protect, requireRole('admin'), updateConfig);
router.delete('/:id', protect, requireRole('admin'), deleteAuction);
router.get('/:id/order', protect, getOrder);
router.patch('/:id/order', protect, requireRole('admin'), setOrder);
router.get('/:id/report', protect, getReport);
router.get('/:id/report/recipients', protect, requireRole('admin'), getReportRecipients);
router.post('/:id/report/share', protect, requireRole('admin'), shareReport);

// Flow control (admin only)
router.post('/:id/start', protect, requireRole('admin'), start);
router.post('/:id/pause', protect, requireRole('admin'), pause);
router.post('/:id/resume', protect, requireRole('admin'), resume);
router.post('/:id/end', protect, requireRole('admin'), end);
router.post('/:id/next-player', protect, requireRole('admin'), nextPlayer);
router.post('/:id/sold', protect, requireRole('admin'), sold);
router.post('/:id/unsold', protect, requireRole('admin'), unsold);
router.post('/:id/override-bid', protect, requireRole('admin'), overrideBid);
router.post('/:id/advance-round', protect, requireRole('admin'), advanceRound);
router.post('/:id/offline-bid', protect, requireRole('admin'), setOfflineBid);
router.post('/:id/reverse-bid', protect, requireRole('admin'), reverseBid);
router.post('/:id/players/:pid/release', protect, requireRole('admin'), releasePlayer);

// Player release request flow
router.post('/:id/release-requests', protect, requireRole('team_owner'), createRequest);
router.get('/:id/release-requests', protect, requireRole('admin'), listRequests);
router.post('/:id/release-requests/:reqId/approve', protect, requireRole('admin'), approveRequest);
router.post('/:id/release-requests/:reqId/reject', protect, requireRole('admin'), rejectRequest);

module.exports = router;
