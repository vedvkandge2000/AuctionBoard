const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { uploadPlayerPhoto, uploadTeamLogo } = require('../controllers/upload.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.post('/player-photo', protect, requireRole('admin'), upload.single('photo'), uploadPlayerPhoto);
router.post('/team-logo', protect, requireRole('admin'), upload.single('logo'), uploadTeamLogo);

module.exports = router;
