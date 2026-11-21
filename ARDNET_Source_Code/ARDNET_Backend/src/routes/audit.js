
const express = require('express');
const auditController = require('../controllers/auditController');
const {
  verifyToken,
  requireRole,
} = require('../middleware/auth');

const router = express.Router();

// Only authenticated administrators can view audit logs.
router.get(
  '/',
  verifyToken,
  requireRole(['admin']),
  auditController.getAuditLogs
);

module.exports = router;
