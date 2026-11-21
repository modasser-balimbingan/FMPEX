
const express = require('express');
const {
  verifyToken,
  requireRole,
} = require('../middleware/auth');

const adminUserController = require('../controllers/adminUserController');

const router = express.Router();

// All user-management endpoints require an administrator.
router.use(verifyToken, requireRole(['admin']));

router.get('/', adminUserController.getUsers);

router.patch('/:id/status', adminUserController.updateUserStatus);

module.exports = router;
