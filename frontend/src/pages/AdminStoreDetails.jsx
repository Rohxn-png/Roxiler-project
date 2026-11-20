import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import { LoadingState } from '../components/Loading.jsx';
import { StarDisplay } from '../components/Stars.jsx';
import { formatRating, textOrDash } from '../utils.js';

export default function AdminStoreDetails() {
    const { token } = useAuth();
    const { id } = useParams();

    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError('');

        api.getAdminStore(token, id)
            .then((data) => {
                if (active) {
                    setStore(data);
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
    }, [token, id]);

    const average = Number(store?.averageRating) || 0;
    const totalRatings = Number(store?.totalRatings) || 0;
    const meterWidth = Math.min(100, Math.max(0, (average / 5) * 100));

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Admin / Stores</p>
                    <h1>Store details</h1>
                    <p className="muted">
                        Review store information and its rating performance.
                    </p>
                </div>
                <div className="heading-actions">
                    <Link className="btn btn-ghost" to="/admin/stores">
                        <Icon
                            name="arrowRight"
                            size={16}
                            className="icon-flip"
                        />
                        Back to stores
                    </Link>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <LoadingState label="Loading store..." />
            ) : (
                store && (
                    <>
                        <section className="profile-hero card">
                            <span className="store-avatar store-avatar-xl">
                                <Icon name="store" size={30} />
                            </span>
                            <div className="profile-hero-text">
                                <div className="profile-hero-title">
                                    <h2>{store.name}</h2>
                                    <span className="chip">Store</span>
                                </div>
                                <p>{store.email}</p>
                                <div className="profile-hero-meta">
                                    <span>
                                        <Icon name="mapPin" size={14} />
                                        {textOrDash(store.address)}
                                    </span>
                                </div>
                            </div>
                            <div className="hero-rating">
                                <span className="rating-pill">
                                    {formatRating(store.averageRating)}
                                </span>
                                <StarDisplay value={store.averageRating} />
                                <span className="muted">
                                    {totalRatings} rating(s)
                                </span>
                            </div>
                        </section>

                        <div className="stat-grid">
                            <article className="stat-card stat-card-amber">
                                <span className="stat-icon">
                                    <Icon name="star" size={21} filled />
                                </span>
                                <div className="stat-body">
                                    <span className="stat-label">
                                        Average rating
                                    </span>
                                    <strong>
                                        {formatRating(store.averageRating)}
                                    </strong>
                                    <StarDisplay
                                        value={store.averageRating}
                                    />
                                </div>
                            </article>

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
                                        Customer submissions
                                    </span>
                                </div>
                            </article>

                            <article className="stat-card stat-card-violet">
                                <span className="stat-icon">
                                    <Icon name="store" size={21} />
                                </span>
                                <div className="stat-body">
                                    <span className="stat-label">
                                        Store ID
                                    </span>
                                    <strong>#{store.id}</strong>
                                    <span className="stat-note">
                                        {totalRatings > 0
                                            ? 'Receiving ratings'
                                            : 'Awaiting first rating'}
                                    </span>
                                </div>
                            </article>
                        </div>

                        <div className="two-col">
                            <section className="card detail-card">
                                <div className="card-heading">
                                    <div>
                                        <h2>Store information</h2>
                                        <p className="muted">
                                            Read-only store record.
                                        </p>
                                    </div>
                                    <span className="card-icon card-icon-blue">
                                        <Icon name="building" size={19} />
                                    </span>
                                </div>

                                <dl className="detail-grid">
                                    <div>
                                        <dt>Store ID</dt>
                                        <dd>{store.id}</dd>
                                    </div>
                                    <div>
                                        <dt>Email</dt>
                                        <dd>{store.email}</dd>
                                    </div>
                                    <div>
                                        <dt>Average rating</dt>
                                        <dd>
                                            {formatRating(
                                                store.averageRating
                                            )}{' '}
                                            / 5
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Total ratings</dt>
                                        <dd>{totalRatings}</dd>
                                    </div>
                                    <div className="detail-full">
                                        <dt>Address</dt>
                                        <dd>{textOrDash(store.address)}</dd>
                                    </div>
                                </dl>
                            </section>

                            <section className="card panel-card">
                                <div className="panel-head">
                                    <div>
                                        <h2>Rating snapshot</h2>
                                        <p className="muted">
                                            Community score out of five.
                                        </p>
                                    </div>
                                    <span className="chip">
                                        {totalRatings > 0
                                            ? 'Live'
                                            : 'No ratings'}
                                    </span>
                                </div>

                                <div className="rating-showcase">
                                    <div className="rating-showcase-value">
                                        {formatRating(store.averageRating)}
                                        <span>/ 5</span>
                                    </div>
                                    <StarDisplay
                                        value={store.averageRating}
                                    />
                                    <span className="muted">
                                        Based on {totalRatings} rating(s)
                                    </span>
                                </div>

                                <div
                                    className="rating-meter"
                                    aria-hidden="true"
                                >
                                    <span
                                        style={{ width: `${meterWidth}%` }}
                                    />
                                </div>
                                <div className="rating-scale">
                                    <span>1</span>
                                    <span>5</span>
                                </div>

                                <div className="security-tips">
                                    <div className="security-tip">
                                        <Icon name="info" size={16} />
                                        <span>
                                            Averages update automatically
                                            whenever a customer submits a new
                                            rating.
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </>
                )
            )}
        </div>
    );
}
