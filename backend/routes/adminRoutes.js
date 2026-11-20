
const express = require('express');
const router = express.Router();

const {
    createUser,
    createStore,
    getDashboardStats,
    getUsers,
    getUserDetails,
    getStores,
    getStoreDetails
} = require('../controllers/adminController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// All admin routes require authentication and ADMIN role
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

// Create a user
router.post('/users', createUser);

// Create a new store
router.post('/stores', createStore);

// Dashboard statistics
router.get('/dashboard', getDashboardStats);

// List and filter users
router.get('/users', getUsers);

// View individual user
router.get('/users/:id', getUserDetails);

// List and filter stores
router.get('/stores', getStores);

// View individual store
router.get('/stores/:id', getStoreDetails);

module.exports = router;
