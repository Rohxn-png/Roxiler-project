const pool = require('../config/db');

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
    created_at: row.created_at
});

const getOwnedStores = async (ownerId) => {
    const [stores] = await pool.execute(
        `SELECT
            s.id,
            s.name,
            s.email,
            s.address,
            s.created_at,
            ROUND(COALESCE(AVG(r.rating), 0), 2) AS averageRating,
            COUNT(r.id) AS totalRatings
         FROM stores s
         LEFT JOIN ratings r ON r.store_id = s.id
         WHERE s.owner_id = ?
         GROUP BY s.id, s.name, s.email, s.address, s.created_at
         ORDER BY s.id ASC`,
        [ownerId]
    );

    return stores.map(mapStore);
};

// View all stores owned by the logged-in owner
exports.getMyStores = async (req, res) => {
    try {
        const stores = await getOwnedStores(req.user.id);

        return res.status(200).json(stores);

    } catch (error) {
        console.error('Get owner stores error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// View the (first) store owned by the logged-in owner
exports.getMyStore = async (req, res) => {
    try {
        const stores = await getOwnedStores(req.user.id);

        if (stores.length === 0) {
            return res.status(404).json({
                message: 'No store is assigned to this owner'
            });
        }

        return res.status(200).json(stores[0]);

    } catch (error) {
        console.error('Get owner store error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// View ratings for the logged-in owner's stores only
exports.getMyStoreRatings = async (req, res) => {
    try {
        const [ratings] = await pool.execute(
            `SELECT
                r.id,
                r.rating,
                r.created_at,
                r.updated_at,
                s.id AS storeId,
                s.name AS storeName,
                u.id AS userId,
                u.name AS userName,
                u.email AS userEmail
             FROM ratings r
             INNER JOIN stores s ON s.id = r.store_id
             INNER JOIN users u ON u.id = r.user_id
             WHERE s.owner_id = ?
             ORDER BY r.updated_at DESC, r.id DESC`,
            [req.user.id]
        );

        return res.status(200).json(
            ratings.map((row) => ({
                ...row,
                rating: Number(row.rating)
            }))
        );

    } catch (error) {
        console.error('Get owner ratings error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
