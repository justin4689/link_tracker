const express         = require('express');
const linksController = require('../controllers/linksController');

const router = express.Router();

router.post('/',            linksController.createLink);
router.get('/:id/clicks',   linksController.getLinkClicks);

module.exports = router;
