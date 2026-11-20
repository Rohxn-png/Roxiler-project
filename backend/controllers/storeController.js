const pool = require('../config/db');
const { isValidRating } = require('../utils/validators');

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const mapStore = (row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    address: row.address,
    averageRating: toNumber(row.averageRating),
    totalRatings: Number(row.totalRatings) || 0,
    myRating:
        row.myRating === null || row.myRating === undefined
            ? null
            : Number(row.myRating),
    created_at: row.created_at
});

const buildStoreQuery = () => `
    SELECT
        s.id,
        s.name,
        s.email,
        s.address,
        s.created_at,
        ROUND(COALESCE(AVG(r.rating), 0), 2) AS averageRating,
        COUNT(r.id) AS totalRatings,
        MAX(CASE WHEN r.user_id = ? THEN r.rating END) AS myRating
    FROM stores s
    LEFT JOIN ratings r ON r.store_id = s.id
    WHERE 1 = 1
`;

const SORT_COLUMNS = {
    name: 's.name',
    address: 's.address',
    created_at: 's.created_at',
    averageRating: 'averageRating',
    totalRatings: 'totalRatings'
};

// Browse / search stores for the logged-in normal user
exports.getStores = async (req, res) => {
    try {
        const { search, name, address, sortBy = 'name', order = 'ASC' } = req.query;

        const sortColumn = SORT_COLUMNS[sortBy] || SORT_COLUMNS.name;
        const sortOrder = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        let sql = buildStoreQuery();
        const params = [req.user.id];

        if (search) {
            sql += ' AND (s.name LIKE ? OR s.address LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (name) {
            sql += ' AND s.name LIKE ?';
            params.push(`%${name}%`);
        }

        if (address) {
            sql += ' AND s.address LIKE ?';
            params.push(`%${address}%`);
        }

        sql += `
            GROUP BY s.id, s.name, s.email, s.address, s.created_at
            ORDER BY ${sortColumn} ${sortOrder}
        `;

        const [stores] = await pool.execute(sql, params);

        return res.status(200).json(stores.map(mapStore));

    } catch (error) {
        console.error('Get stores error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// View one store with its average rating and the current user's rating
exports.getStoreDetails = async (req, res) => {
    try {
        const storeId = Number(req.params.id);

        if (!Number.isInteger(storeId) || storeId <= 0) {
            return res.status(400).json({ message: 'Invalid store id' });
        }

        const sql = `${buildStoreQuery()}
            AND s.id = ?
            GROUP BY s.id, s.name, s.email, s.address, s.created_at
        `;

        const [stores] = await pool.execute(sql, [req.user.id, storeId]);

        if (stores.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }

        return res.status(200).json(mapStore(stores[0]));

    } catch (error) {
        console.error('Get store details error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Submit a new rating or update the existing rating for this store
exports.submitRating = async (req, res) => {
    try {
        const storeId = Number(req.params.id);
        const rating = Number(req.body.rating);

        if (!Number.isInteger(storeId) || storeId <= 0) {
            return res.status(400).json({ message: 'Invalid store id' });
        }

        if (!isValidRating(req.body.rating)) {
            return res.status(400).json({
                message: 'Rating must be an integer between 1 and 5'
            });
        }

        const [stores] = await pool.execute(
            'SELECT id FROM stores WHERE id = ?',
            [storeId]
        );

        if (stores.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }

        const [existing] = await pool.execute(
            'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
            [req.user.id, storeId]
        );

        await pool.execute(
            `INSERT INTO ratings (user_id, store_id, rating)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
                rating = ?,
                updated_at = CURRENT_TIMESTAMP`,
            [req.user.id, storeId, rating, rating]
        );

        const [stats] = await pool.execute(
            `SELECT
                ROUND(COALESCE(AVG(rating), 0), 2) AS averageRating,
                COUNT(*) AS totalRatings
             FROM ratings
             WHERE store_id = ?`,
            [storeId]
        );

        return res.status(existing.length > 0 ? 200 : 201).json({
            message: existing.length > 0
                ? 'Rating updated successfully'
                : 'Rating submitted successfully',
            rating,
            averageRating: toNumber(stats[0].averageRating),
            totalRatings: Number(stats[0].totalRatings) || 0
        });

    } catch (error) {
        console.error('Submit rating error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
