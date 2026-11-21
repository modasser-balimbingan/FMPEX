const express = require('express');
const marketController = require('../controllers/marketController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public endpoints
router.get('/', marketController.getMarketPrices);
router.get('/:produce', marketController.getPricesByProduce);

// Admin only endpoints
router.post('/', verifyToken, requireRole(['admin']), marketController.createMarketPrice);
router.put('/:id', verifyToken, requireRole(['admin']), marketController.updateMarketPrice);
router.delete('/:id', verifyToken, requireRole(['admin']), marketController.deleteMarketPrice);

module.exports = router;
