const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  createAuction, getAuction, listAuctions, updateConfig, deleteAuction, getOrder, setOrder,
} = require('../controllers/auction.controller');
const {
  start, pause, resume, end, nextPlayer, sold, unsold, overrideBid,
} = require('../controllers/auctionFlow.controller');

const router = express.Router();

router.get('/', protect, listAuctions);
router.post('/', protect, requireRole('admin'), createAuction);
router.get('/:id', protect, getAuction);
router.patch('/:id/config', protect, requireRole('admin'), updateConfig);
router.delete('/:id', protect, requireRole('admin'), deleteAuction);
router.get('/:id/order', protect, getOrder);
router.patch('/:id/order', protect, requireRole('admin'), setOrder);

// Flow control (admin only)
router.post('/:id/start', protect, requireRole('admin'), start);
router.post('/:id/pause', protect, requireRole('admin'), pause);
router.post('/:id/resume', protect, requireRole('admin'), resume);
router.post('/:id/end', protect, requireRole('admin'), end);
router.post('/:id/next-player', protect, requireRole('admin'), nextPlayer);
router.post('/:id/sold', protect, requireRole('admin'), sold);
router.post('/:id/unsold', protect, requireRole('admin'), unsold);
router.post('/:id/override-bid', protect, requireRole('admin'), overrideBid);

module.exports = router;
