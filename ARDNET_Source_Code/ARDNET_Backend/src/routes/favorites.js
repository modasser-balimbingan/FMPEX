const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { getMyFavorites } = require('../controllers/favoritesController');

// Mount at /api/favorites. The POST/DELETE methods are mounted in routes/listings.js.
const router = express.Router();
router.get('/', verifyToken, requireRole('farmer', 'buyer'), getMyFavorites);
module.exports = router;
