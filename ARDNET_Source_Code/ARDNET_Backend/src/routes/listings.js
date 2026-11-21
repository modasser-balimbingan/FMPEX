const express = require('express');
const listingsController = require('../controllers/listingsController');
const commentsController = require('../controllers/commentsController');
const favoritesController = require('../controllers/favoritesController');
const { verifyToken, requireRole } = require('../middleware/auth');
const uploadProducePhotos = require('../middleware/producePhotoUpload');

const router = express.Router();

router.get('/', listingsController.getListings);

router.get(
  '/my-listings',
  verifyToken,
  listingsController.getMyListings
);

// Listing discussion routes must stay above '/:id'.
router.get('/:id/comments', commentsController.getListingComments);
router.post(
  '/:id/comments',
  verifyToken,
  requireRole('farmer', 'buyer'),
  commentsController.createComment
);

// Save/unsave a listing for the authenticated Farmer or Buyer/Vendor.
router.post('/:id/favorite', verifyToken, requireRole('farmer', 'buyer'), favoritesController.addFavorite);
router.delete('/:id/favorite', verifyToken, requireRole('farmer', 'buyer'), favoritesController.removeFavorite);

router.get(
  '/:id',
  listingsController.getListingById
);

router.post(
  '/',
  verifyToken,
  requireRole(['farmer']),
  uploadProducePhotos.array('photos', 5),
  listingsController.createListing
);

router.put(
  '/:id',
  verifyToken,
  uploadProducePhotos.array('photos', 5),
  listingsController.updateListing
);

router.delete(
  '/:id',
  verifyToken,
  listingsController.deleteListing
);

module.exports = router;