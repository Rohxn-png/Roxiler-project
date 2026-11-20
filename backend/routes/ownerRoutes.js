const express = require('express');
const router = express.Router();

const {
    getMyStores,
    getMyStore,
    getMyStoreRatings
} = require('../controllers/ownerController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// All owner routes require authentication and the OWNER role
router.use(authenticateToken);
router.use(authorizeRoles('OWNER'));

router.get('/stores', getMyStores);
router.get('/store', getMyStore);
router.get('/ratings', getMyStoreRatings);

module.exports = router;
