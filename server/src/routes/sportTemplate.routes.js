const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  cloneTemplate,
} = require('../controllers/sportTemplate.controller');

const router = express.Router();

router.get('/', listTemplates);                                          // public — player registration needs this
router.get('/:id', protect, getTemplate);
router.post('/', protect, requireRole('admin'), createTemplate);
router.patch('/:id', protect, requireRole('admin'), updateTemplate);
router.delete('/:id', protect, requireRole('admin'), deleteTemplate);
router.post('/:id/clone', protect, requireRole('admin'), cloneTemplate);

module.exports = router;
