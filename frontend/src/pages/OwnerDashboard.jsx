import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import Icon from '../components/Icon.jsx';
import { LoadingState } from '../components/Loading.jsx';
import { StarDisplay } from '../components/Stars.jsx';
import { formatDate, formatRating } from '../utils.js';

export default function OwnerDashboard() {
    const { token, user } = useAuth();

    const [stores, setStores] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError('');

        Promise.all([api.getOwnerStores(token), api.getOwnerRatings(token)])
            .then(([storeData, ratingData]) => {
                if (active) {
                    setStores(storeData);
                    setRatings(ratingData);
                }
            })
            .catch((requestError) => {
                if (active) {
                    setError(requestError.message);
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [token]);

    const totalRatings = ratings.length;
    const primaryStore = stores[0];
    const totalStoreRatings = stores.reduce(
        (total, store) => total + (Number(store.totalRatings) || 0),
        0
    );
    const weightedAverage = stores.reduce((total, store) => {
        const average = Number(store.averageRating) || 0;
        const count = Number(store.totalRatings) || 0;
        return total + average * count;
    }, 0);
    const portfolioAverage = totalStoreRatings
        ? weightedAverage / totalStoreRatings
        : 0;

    const fiveStarRatings = ratings.filter(
        (rating) => Number(rating.rating) === 5
    ).length;

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: ratings.filter((rating) => Number(rating.rating) === star)
            .length
    }));

    const maxDistribution = Math.max(
        ...distribution.map((entry) => entry.count),
        1
    );

    return (
        <div className="page">
            <section className="hero-banner hero-banner-owner">
                <div className="hero-banner-content">
                    <span className="hero-badge">
                        <Icon name="store" size={14} />
                        Store owner
                    </span>
                    <h1>Welcome, {user?.name}</h1>
                    <p>
                        See how customers feel about your store, follow every
                        new rating and keep your account secure.
                    </p>
                    <div className="hero-actions">
                        <Link className="btn btn-light" to="/profile">
                            <Icon name="key" size={16} />
                            Update password
                        </Link>
                        {primaryStore && (
                            <span className="hero-meta-pill">
                                <Icon name="store" size={14} />
                                {primaryStore.name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="hero-orbit" aria-hidden="true">
                    <div className="hero-orbit-inner">
                        <span className="hero-orbit-label">
                            Portfolio average
                        </span>
                        <strong>
                            {loading ? '—' : formatRating(portfolioAverage)}
                        </strong>
                        <span className="hero-orbit-sub">
                            {loading ? '—' : totalStoreRatings} rating(s)
                        </span>
                    </div>
                </div>
            </section>

            {error && (
                <div className="alert alert-error" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <LoadingState label="Loading your store..." />
            ) : stores.length === 0 ? (
                <div className="card empty-state">
                    <span className="empty-icon">
                        <Icon name="store" size={24} />
                    </span>
                    <h2>No store assigned</h2>
                    <p>
                        An administrator has not assigned a store to your
                        account yet.
                    </p>
                </div>
            ) : (
                <>
                    <div className="stat-grid">
                        {stores.map((store) => (
                            <article
                                className="stat-card stat-card-violet"
                                key={store.id}
                            >
                                <span className="stat-icon">
                                    <Icon name="store" size={21} />
                                </span>
                                <div className="stat-body">
                                    <span className="stat-label">
                                        {store.name}
                                    </span>
                                    <strong>
                                        {formatRating(store.averageRating)}
                                    </strong>
                                    <StarDisplay
                                        value={store.averageRating}
                                    />
                                    <span className="stat-note">
                                        {Number(store.totalRatings) || 0}{' '}
                                        rating(s) · {store.address}
                                    </span>
                                </div>
                            </article>
                        ))}

                        <article className="stat-card stat-card-blue">
                            <span className="stat-icon">
                                <Icon name="users" size={21} />
                            </span>
                            <div className="stat-body">
                                <span className="stat-label">
                                    Total ratings
                                </span>
                                <strong>{totalRatings}</strong>
                                <span className="stat-note">
                                    Across all your stores
                                </span>
                            </div>
                        </article>

                        <article className="stat-card stat-card-amber">
                            <span className="stat-icon">
                                <Icon name="award" size={21} />
                            </span>
                            <div className="stat-body">
                                <span className="stat-label">
                                    Five-star ratings
                                </span>
                                <strong>{fiveStarRatings}</strong>
                                <span className="stat-note">
                                    Customers who loved their experience
                                </span>
                            </div>
                        </article>
                    </div>

                    <div className="dashboard-grid">
                        <section className="card panel-card">
                            <div className="panel-head">
                                <div>
                                    <h2>Store snapshot</h2>
                                    <p className="muted">
                                        Your store at a glance.
                                    </p>
                                </div>
                                <span className="chip">
                                    <Icon name="store" size={13} />
                                    Live
                                </span>
                            </div>

                            <div className="snapshot-store">
                                <span className="store-avatar store-avatar-lg">
                                    <Icon name="store" size={22} />
                                </span>
                                <div>
                                    <strong>{primaryStore?.name}</strong>
                                    <span>{primaryStore?.email}</span>
                                </div>
                            </div>

                            <div className="snapshot-grid">
                                <div className="snapshot-item">
                                    <span className="snapshot-label">
                                        Average rating
                                    </span>
                                    <strong>
                                        {formatRating(
                                            primaryStore?.averageRating
                                        )}
                                    </strong>
                                    <StarDisplay
                                        value={primaryStore?.averageRating}
                                    />
                                </div>
                                <div className="snapshot-item">
                                    <span className="snapshot-label">
                                        Total ratings
                                    </span>
                                    <strong>
                                        {Number(
                                            primaryStore?.totalRatings
                                        ) || 0}
                                    </strong>
                                    <span className="snapshot-note">
                                        rating(s)
                                    </span>
                                </div>
                            </div>

                            <div className="snapshot-address">
                                <Icon name="mapPin" size={15} />
                                <span>
                                    {primaryStore?.address || 'No address'}
                                </span>
                            </div>
                        </section>

                        <section className="card panel-card">
                            <div className="panel-head">
                                <div>
                                    <h2>Rating distribution</h2>
                                    <p className="muted">
                                        How customers scored your store.
                                    </p>
                                </div>
                                <span className="chip">
                                    {totalRatings} total
                                </span>
                            </div>

                            <div className="rating-distribution">
                                {distribution.map((entry) => (
                                    <div
                                        className="rating-bar-row"
                                        key={entry.star}
                                    >
                                        <span className="rating-bar-label">
                                            {entry.star} star
                                        </span>
                                        <div className="rating-bar-track">
                                            <span
                                                className="rating-bar-fill"
                                                style={{
                                                    width: `${Math.round(
                                                        (entry.count /
                                                            maxDistribution) *
                                                            100
                                                    )}%`
                                                }}
                                            />
                                        </div>
                                        <span className="rating-bar-count">
                                            {entry.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="card table-card">
                        <div className="table-header">
                            <div>
                                <h2>Users who rated your store</h2>
                                <p className="muted">
                                    Every customer rating, newest first.
                                </p>
                            </div>
                            <span className="chip">
                                {totalRatings} rating(s)
                            </span>
                        </div>

                        {ratings.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">
                                    <Icon name="star" size={22} />
                                </span>
                                <h3>No ratings yet</h3>
                                <p>No ratings have been submitted yet.</p>
                            </div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Store</th>
                                            <th>User name</th>
                                            <th>Email</th>
                                            <th>Rating</th>
                                            <th>Last updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ratings.map((rating) => (
                                            <tr key={rating.id}>
                                                <td>{rating.storeName}</td>
                                                <td>
                                                    <div className="table-user">
                                                        <Avatar
                                                            name={rating.userName}
                                                            size="sm"
                                                        />
                                                        <div>
                                                            <strong>
                                                                {
                                                                    rating.userName
                                                                }
                                                            </strong>
                                                            <span>
                                                                Customer
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{rating.userEmail}</td>
                                                <td>
                                                    <span className="rating-cell">
                                                        <StarDisplay
                                                            value={rating.rating}
                                                        />
                                                        <strong>
                                                            {rating.rating} / 5
                                                        </strong>
                                                    </span>
                                                </td>
                                                <td>
                                                    {formatDate(
                                                        rating.updated_at ||
                                                            rating.created_at
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
