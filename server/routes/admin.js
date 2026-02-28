const express = require('express');

const { requireAuth, requireAdmin } = require('../middleware/auth');
const adminCtrl = require('../controllers/adminController');

const router = express.Router();

router.delete('/:id', requireAuth(), requireAdmin, adminCtrl.deletePost);

module.exports = router;