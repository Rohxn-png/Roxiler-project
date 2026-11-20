const express = require('express');
const router = express.Router();

const {
    getMyProfile,
    updatePassword
} = require('../controllers/userController');

const authenticateToken = require('../middleware/authMiddleware');

// These routes always use the id from the JWT, never an id from the URL
router.use(authenticateToken);

router.get('/me', getMyProfile);
router.put('/password', updatePassword);

module.exports = router;
