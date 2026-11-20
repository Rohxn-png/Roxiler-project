import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import { LoadingState } from '../components/Loading.jsx';
import { StarDisplay } from '../components/Stars.jsx';
import { formatRating } from '../utils.js';

const ROLE_LABELS = {
    ADMIN: 'Admins',
    USER: 'Users',
    OWNER: 'Owners'
};

export default function AdminDashboard() {
    const { token, user } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError('');

        Promise.all([
            api.getAdminDashboard(token),
            api.getAdminUsers(token, { sortBy: 'name', order: 'ASC' }),
            api.getAdminStores(token, { sortBy: 'name', order: 'ASC' })
        ])
            .then(([stats, users, stores]) => {
                if (active) {
                    setData({ stats, users, stores });
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

    const firstName = user?.name?.trim().split(/\s+/)[0] || 'Admin';
    const stats = data?.stats;
    const users = data?.users || [];
    const stores = data?.stores || [];

    const roleRows = ['ADMIN', 'USER', 'OWNER'].map((role) => {
        const count = users.filter((item) => item.role === role).length;

        return {
            role,
            count,
            percent: users.length
                ? Math.round((count / users.length) * 100)
                : 0
        };
    });

    const topStores = [...stores]
        .map((store) => ({
            ...store,
            averageRating: Number(store.averageRating) || 0
        }))
        .filter((store) => store.averageRating > 0)
        .sort((first, second) => second.averageRating - first.averageRating)
        .slice(0, 5);

    const ratedStores = stores.filter(
        (store) => Number(store.averageRating) > 0
    ).length;

    return (
        <div className="page">
            <section className="hero-banner">
                <div className="hero-banner-content">
                    <span className="hero-badge">
                        <Icon name="shield" size={14} />
                        Admin dashboard
                    </span>
                    <h1>Good to see you, {firstName}.</h1>
                    <p>
                        Keep the platform healthy. Review accounts, manage
                        stores and monitor the ratings customers leave behind.
                    </p>
                    <div className="hero-actions">
                        <Link className="btn btn-light" to="/admin/users">
                            <Icon name="users" size={16} />
                            Manage users
                        </Link>
                        <Link className="btn btn-ghost-light" to="/admin/stores">
                            <Icon name="store" size={16} />
                            Manage stores
                        </Link>
                    </div>
                </div>

                <div className="hero-orbit" aria-hidden="true">
                    <div className="hero-orbit-inner">
                        <span className="hero-orbit-label">Live ratings</span>
                        <strong>{stats ? stats.totalRatings : '—'}</strong>
                        <span className="hero-orbit-sub">
                            across {stats ? stats.totalStores : '—'} stores
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
                <LoadingState label="Loading dashboard..." />
            ) : (
                data && (
                    <>
                        <div className="stat-grid">
                            <article className="stat-card stat-card-blue">
                                <span className="stat-icon">
                                    <Icon name="users" size={21} />
                                </span>
                                <div className="stat-body">
                                    <span className="stat-label">
                                        Total users
                                    </span>
                                    <strong>{stats.totalUsers}</strong>
                                    <span className="stat-note">
                                        Across all three roles
                                    </span>
                                </div>
                                <Link
                                    className="stat-link"
                                    to="/admin/users"
                                >
                                    View users
                                    <Icon name="arrowRight" size={14} />
                                </Link>
                            </article>

                            <article className="stat-card stat-card-violet">
                                <span className="stat-icon">
                                    <Icon name="store" size={21} />
                                </span>
                                <div className="stat-body">
                                    <span className="stat-label">
                                        Total stores
                                    </span>
                                    <strong>{stats.totalStores}</strong>
                                    <span className="stat-note">
                                        {ratedStores} with ratings
                                    </span>
                                </div>
                                <Link
                                    className="stat-link"
                                    to="/admin/stores"
                                >
                                    View stores
                                    <Icon name="arrowRight" size={14} />
                                </Link>
                            </article>

                            <article className="stat-card stat-card-amber">
                                <span className="stat-icon">
                                    <Icon name="star" size={21} filled />
                                </span>
                                <div className="stat-body">
                                    <span className="stat-label">
                                        Total ratings
                                    </span>
                                    <strong>{stats.totalRatings}</strong>
                                    <span className="stat-note">
                                        Submitted by customers
                                    </span>
                                </div>
                                <span className="stat-link stat-link-muted">
                                    <Icon name="trendingUp" size={14} />
                                    Live data
                                </span>
                            </article>
                        </div>

                        <div className="quick-action-grid">
                            <Link className="quick-action" to="/admin/users">
                                <span className="quick-action-icon">
                                    <Icon name="users" size={19} />
                                </span>
                                <span>
                                    <strong>Create or review users</strong>
                                    <small>Admins, owners and customers</small>
                                </span>
                                <Icon name="arrowRight" size={16} />
                            </Link>
                            <Link className="quick-action" to="/admin/stores">
                                <span className="quick-action-icon">
                                    <Icon name="store" size={19} />
                                </span>
                                <span>
                                    <strong>Add a store</strong>
                                    <small>Assign it to an owner account</small>
                                </span>
                                <Icon name="arrowRight" size={16} />
                            </Link>
                            <Link className="quick-action" to="/profile">
                                <span className="quick-action-icon">
                                    <Icon name="key" size={19} />
                                </span>
                                <span>
                                    <strong>Secure your account</strong>
                                    <small>Update your admin password</small>
                                </span>
                                <Icon name="arrowRight" size={16} />
                            </Link>
                        </div>

                        <div className="dashboard-grid">
                            <section className="card panel-card">
                                <div className="panel-head">
                                    <div>
                                        <h2>Role distribution</h2>
                                        <p className="muted">
                                            {users.length} account(s) on the
                                            platform
                                        </p>
                                    </div>
                                    <span className="chip">
                                        <Icon name="users" size={13} />
                                        {users.length}
                                    </span>
                                </div>

                                <div className="role-bars">
                                    {roleRows.map((row) => (
                                        <div
                                            className="role-bar-row"
                                            key={row.role}
                                        >
                                            <div className="role-bar-label">
                                                <span
                                                    className={`role-badge role-${row.role.toLowerCase()}`}
                                                >
                                                    {row.role}
                                                </span>
                                                <span>
                                                    {row.count} · {row.percent}%
                                                </span>
                                            </div>
                                            <div className="role-bar-track">
                                                <span
                                                    className={`role-bar-fill role-fill-${row.role.toLowerCase()}`}
                                                    style={{
                                                        width: `${row.percent}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="card panel-card">
                                <div className="panel-head">
                                    <div>
                                        <h2>Top rated stores</h2>
                                        <p className="muted">
                                            Highest average ratings
                                        </p>
                                    </div>
                                    <Link
                                        className="panel-link"
                                        to="/admin/stores"
                                    >
                                        All stores
                                        <Icon
                                            name="arrowRight"
                                            size={14}
                                        />
                                    </Link>
                                </div>

                                {topStores.length === 0 ? (
                                    <div className="empty-inline">
                                        <span className="empty-icon">
                                            <Icon name="star" size={20} />
                                        </span>
                                        <p>
                                            No store has received a rating yet.
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="top-store-list">
                                        {topStores.map((store, index) => (
                                            <li
                                                className="top-store-item"
                                                key={store.id}
                                            >
                                                <span className="top-store-rank">
                                                    {index + 1}
                                                </span>
                                                <div className="top-store-meta">
                                                    <strong>
                                                        {store.name}
                                                    </strong>
                                                    <span>
                                                        {store.address}
                                                    </span>
                                                </div>
                                                <div className="top-store-rating">
                                                    <strong>
                                                        {formatRating(
                                                            store.averageRating
                                                        )}
                                                    </strong>
                                                    <StarDisplay
                                                        value={
                                                            store.averageRating
                                                        }
                                                    />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </div>
                    </>
                )
            )}
        </div>
    );
}
