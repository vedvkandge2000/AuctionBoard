const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  listPlayers, addPlayer, updatePlayer, deletePlayer, bulkImport, downloadTemplate,
} = require('../controllers/player.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router({ mergeParams: true });

router.get('/', protect, listPlayers);
router.post('/', protect, requireRole('admin'), addPlayer);
router.get('/template', downloadTemplate);
router.post('/bulk', protect, requireRole('admin'), upload.single('file'), bulkImport);
router.patch('/:pid', protect, requireRole('admin'), updatePlayer);
router.delete('/:pid', protect, requireRole('admin'), deletePlayer);

module.exports = router;
