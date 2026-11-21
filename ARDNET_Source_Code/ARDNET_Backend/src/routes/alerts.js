const express = require('express');
const alertsController = require('../controllers/alertsController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Protected endpoints (requires authentication)
router.post('/', verifyToken, alertsController.createAlert);
router.get('/', verifyToken, alertsController.getUserAlerts);
router.put('/:id', verifyToken, alertsController.updateAlert);
router.delete('/:id', verifyToken, alertsController.deleteAlert);

module.exports = router;
