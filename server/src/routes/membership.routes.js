const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { applyToAuction, getMyMemberships, withdrawApplication } = require('../controllers/membership.controller');

const router = express.Router();

router.use(protect, requireRole('team_owner'));

router.post('/', applyToAuction);
router.get('/mine', getMyMemberships);
router.delete('/:id', withdrawApplication);

module.exports = router;
