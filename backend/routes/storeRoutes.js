const express = require('express');
const router = express.Router();

const {
    getStores,
    getStoreDetails,
    submitRating
} = require('../controllers/storeController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// All store browsing/rating endpoints are for normal users only
router.use(authenticateToken);
router.use(authorizeRoles('USER'));

router.get('/', getStores);
router.get('/:id', getStoreDetails);
router.post('/:id/ratings', submitRating);

module.exports = router;
