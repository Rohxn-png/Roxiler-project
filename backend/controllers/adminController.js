
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// 1. Create a new user (ADMIN, USER or OWNER)
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, address, role } = req.body;

        if (!name || !email || !password || !address || !role) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (name.trim().length < 20 || name.trim().length > 60) {
            return res.status(400).json({
                message: 'Name must be between 20 and 60 characters'
            });
        }

        if (address.trim().length > 400) {
            return res.status(400).json({
                message: 'Address cannot exceed 400 characters'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must be 8-16 characters with uppercase and special character'
            });
        }

        const validRoles = ['ADMIN', 'USER', 'OWNER'];

        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password, address, role)
             VALUES (?, ?, ?, ?, ?)`,
            [
                name.trim(),
                email.trim().toLowerCase(),
                hashedPassword,
                address.trim(),
                role
            ]
        );

        return res.status(201).json({
            message: 'User created successfully',
            userId: result.insertId,
            role
        });

    } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// 2. Dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT COUNT(*) AS totalUsers FROM users'
        );

        const [stores] = await pool.execute(
            'SELECT COUNT(*) AS totalStores FROM stores'
        );

        const [ratings] = await pool.execute(
            'SELECT COUNT(*) AS totalRatings FROM ratings'
        );

        return res.status(200).json({
            totalUsers: users[0].totalUsers,
            totalStores: stores[0].totalStores,
            totalRatings: ratings[0].totalRatings
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// 3. List and filter users
exports.getUsers = async (req, res) => {
    try {
        const { name, email, address, role, sortBy = 'name', order = 'ASC' } = req.query;

        const allowedSortFields = ['name', 'email', 'address', 'role', 'created_at'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        let sql = `
            SELECT id, name, email, address, role
            FROM users
            WHERE 1=1
        `;

        const params = [];

        if (name) {
            sql += ' AND name LIKE ?';
            params.push(`%${name}%`);
        }

        if (email) {
            sql += ' AND email LIKE ?';
            params.push(`%${email}%`);
        }

        if (address) {
            sql += ' AND address LIKE ?';
            params.push(`%${address}%`);
        }

        if (role) {
            sql += ' AND role = ?';
            params.push(role);
        }

        sql += ` ORDER BY ${sortField} ${sortOrder}`;

        const [users] = await pool.execute(sql, params);

        return res.status(200).json(users);

    } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// 4. View user details
exports.getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await pool.execute(
            `SELECT id, name, email, address, role, created_at
             FROM users WHERE id = ?`,
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(users[0]);

    } catch (error) {
        console.error('User details error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// 5. List stores with average ratings
exports.getStores = async (req, res) => {
    try {
        const { name, email, address, sortBy = 'name', order = 'ASC' } = req.query;

        const allowedSortFields = ['name', 'email', 'address', 'created_at'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        let sql = `
            SELECT
                s.id,
                s.name,
                s.email,
                s.address,
                COALESCE(AVG(r.rating), 0) AS averageRating
            FROM stores s
            LEFT JOIN ratings r ON s.id = r.store_id
            WHERE 1=1
        `;

        const params = [];

        if (name) {
            sql += ' AND s.name LIKE ?';
            params.push(`%${name}%`);
        }

        if (email) {
            sql += ' AND s.email LIKE ?';
            params.push(`%${email}%`);
        }

        if (address) {
            sql += ' AND s.address LIKE ?';
            params.push(`%${address}%`);
        }

        sql += ` GROUP BY s.id ORDER BY s.${sortField} ${sortOrder}`;

        const [stores] = await pool.execute(sql, params);

        return res.status(200).json(stores);

    } catch (error) {
        console.error('Get stores error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// 6. View store details and ratings
exports.getStoreDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const [stores] = await pool.execute(
            `SELECT
                s.id,
                s.name,
                s.email,
                s.address,
                COALESCE(AVG(r.rating), 0) AS averageRating,
                COUNT(r.id) AS totalRatings
             FROM stores s
             LEFT JOIN ratings r ON s.id = r.store_id
             WHERE s.id = ?
             GROUP BY s.id`,
            [id]
        );

        if (stores.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }

        return res.status(200).json(stores[0]);

    } catch (error) {
        console.error('Store details error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// 7. Create a new store and assign an owner
exports.createStore = async (req, res) => {
    try {
        const { name, email, address, owner_id } = req.body;

        // Check required fields
        if (!name || !email || !address || !owner_id) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // Validate store name
        if (name.trim().length < 20 || name.trim().length > 60) {
            return res.status(400).json({
                message: 'Store name must be between 20 and 60 characters'
            });
        }

        // Validate address
        if (address.trim().length > 400) {
            return res.status(400).json({
                message: 'Address cannot exceed 400 characters'
            });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Invalid email address'
            });
        }

        // Check whether owner exists and has OWNER role
        const [owners] = await pool.execute(
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [owner_id, 'OWNER']
        );

        if (owners.length === 0) {
            return res.status(404).json({
                message: 'Store owner not found. Create an OWNER account first.'
            });
        }

        // Check duplicate store email
        const [existingStores] = await pool.execute(
            'SELECT id FROM stores WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (existingStores.length > 0) {
            return res.status(409).json({
                message: 'Store email already exists'
            });
        }

        // Insert store
        const [result] = await pool.execute(
            `INSERT INTO stores (name, email, address, owner_id)
             VALUES (?, ?, ?, ?)`,
            [
                name.trim(),
                email.trim().toLowerCase(),
                address.trim(),
                owner_id
            ]
        );

        return res.status(201).json({
            message: 'Store created successfully',
            storeId: result.insertId,
            ownerId: owner_id
        });

    } catch (error) {
        console.error('Create store error:', error);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};
