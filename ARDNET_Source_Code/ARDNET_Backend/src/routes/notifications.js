const express = require('express');
const notificationsController = require('../controllers/notificationsController');
const { verifyTokenForNotifications } = require('../middleware/auth');

const router = express.Router();
router.get('/', verifyTokenForNotifications, notificationsController.getUserNotifications);
router.patch('/read-all', verifyTokenForNotifications, notificationsController.markAllRead);

module.exports = router;
