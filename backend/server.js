require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authenticateToken = require('./middleware/authMiddleware');
const authorizeRoles = require('./middleware/roleMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/owner', require('./routes/ownerRoutes'));

// Test route
app.get('/', (req, res) => {
    res.json({
        message: 'Store Rating System API is running'
    });
});

// Protected test route
app.get(
    '/api/protected',
    authenticateToken,
    (req, res) => {
        res.json({
            message: 'You are authenticated!',
            user: req.user
        });
    }
);

// Admin-only test route
app.get(
    '/api/admin-test',
    authenticateToken,
    authorizeRoles('ADMIN'),
    (req, res) => {
        res.json({
            message: 'Welcome, Administrator!'
        });
    }
);

// Unknown route handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Central error handler (keeps internal details out of responses)
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    console.error('Unhandled error:', err.message);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON body' });
    }

    return res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
