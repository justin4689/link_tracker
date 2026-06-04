const express            = require('express');
const trackingController = require('../controllers/trackingController');

const router = express.Router();

router.get('/:id', trackingController.trackClick);

module.exports = router;
