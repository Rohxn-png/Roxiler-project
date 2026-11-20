const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { isValidPassword } = require('../utils/validators');

// Get the logged-in user's own profile (never another user's account)
exports.getMyProfile = async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT id, name, email, address, role, created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(users[0]);

    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Update the logged-in user's own password
exports.updatePassword = async (req, res) => {
    try {
        const currentPassword =
            req.body.currentPassword || req.body.oldPassword;
        const { newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required'
            });
        }

        if (!isValidPassword(newPassword)) {
            return res.status(400).json({
                message: 'New password must be 8-16 characters with at least one uppercase letter and one special character'
            });
        }

        const [users] = await pool.execute(
            'SELECT id, password FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            users[0].password
        );

        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                message: 'Current password is incorrect'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        return res.status(200).json({
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Update password error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
