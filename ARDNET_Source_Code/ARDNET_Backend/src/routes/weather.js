const express = require('express');
const weatherController = require('../controllers/weatherController');

const router = express.Router();

// Public endpoints
router.get('/', weatherController.getWeather);
router.get('/coordinates', weatherController.getWeatherByCoordinates);

module.exports = router;
