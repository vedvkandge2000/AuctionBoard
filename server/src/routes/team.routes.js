const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { listTeams, createTeam, updateTeam, deleteTeam, getSquad } = require('../controllers/team.controller');

const router = express.Router({ mergeParams: true });

router.get('/', protect, listTeams);
router.post('/', protect, requireRole('admin', 'team_owner'), createTeam);
router.patch('/:tid', protect, requireRole('admin'), updateTeam);
router.delete('/:tid', protect, requireRole('admin'), deleteTeam);
router.get('/:tid/squad', protect, getSquad);

module.exports = router;
