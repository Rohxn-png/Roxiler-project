import { useEffect, useState } from 'react';

import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import { SkeletonCards } from '../components/Loading.jsx';
import { StarDisplay, StarInput } from '../components/Stars.jsx';
import { formatRating } from '../utils.js';

export default function UserStores() {
    const { token } = useAuth();

    const [search, setSearch] = useState('');
    const [stores, setStores] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [savingId, setSavingId] = useState(null);

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError('');
        setNotice('');

        const timer = setTimeout(
            () => {
                api.getStores(token, { search: search.trim() })
                    .then((data) => {
                        if (active) {
                            setStores(data);
                            setDrafts({});
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
            },
            search.trim() ? 300 : 0
        );

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [token, search]);

    const totalRatings = stores.reduce(
        (total, store) => total + (Number(store.totalRatings) || 0),
        0
    );

    const weightedAverage = stores.reduce((total, store) => {
        const average = Number(store.averageRating) || 0;
        const count = Number(store.totalRatings) || 0;
        return total + average * count;
    }, 0);

    const communityAverage = totalRatings
        ? weightedAverage / totalRatings
        : 0;

    const ratedByYou = stores.filter((store) => Number(store.myRating) > 0)
        .length;

    const submitRating = async (store) => {
        const rating = drafts[store.id] ?? store.myRating;

        if (!rating) {
            setError('Choose a rating from 1 to 5 before submitting.');
            return;
        }

        setSavingId(store.id);
        setError('');
        setNotice('');

        try {
            const data = await api.submitRating(token, store.id, rating);

            setStores((previous) =>
                previous.map((item) =>
                    item.id === store.id
                        ? {
                              ...item,
                              myRating: data.rating,
                              averageRating: data.averageRating,
                              totalRatings: data.totalRatings
                          }
                        : item
                )
            );

            setDrafts((previous) => {
                const next = { ...previous };
                delete next[store.id];
                return next;
            });

            setNotice(`${store.name}: ${data.message}`);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="page">
            <section className="hero-banner hero-banner-user">
                <div className="hero-banner-content">
                    <span className="hero-badge">
                        <Icon name="sparkles" size={14} />
                        Normal user
                    </span>
                    <h1>Browse stores</h1>
                    <p>
                        Discover places worth visiting, compare community
                        ratings and share your own experience in a single tap.
                    </p>
                    <div className="hero-actions">
                        <span className="hero-meta-pill">
                            <Icon name="store" size={14} />
                            {stores.length} store(s) in view
                        </span>
                        <span className="hero-meta-pill">
                            <Icon name="star" size={14} filled />
                            {totalRatings} rating(s)
                        </span>
                    </div>
                </div>

                <div className="hero-orbit" aria-hidden="true">
                    <div className="hero-orbit-inner">
                        <span className="hero-orbit-label">
                            Community average
                        </span>
                        <strong>
                            {loading ? '—' : formatRating(communityAverage)}
                        </strong>
                        <span className="hero-orbit-sub">
                            {ratedByYou} rated by you
                        </span>
                    </div>
                </div>
            </section>

            <section className="card search-panel">
                <div className="search-panel-head">
                    <div>
                        <h2>Find your next favourite store</h2>
                        <p className="muted">
                            Search by store name or address. Results update as
                            you type.
                        </p>
                    </div>
                    <span className="chip">
                        <Icon name="search" size={13} />
                        {stores.length} result(s)
                    </span>
                </div>

                <div className="search-row">
                    <div className="search-control">
                        <Icon name="search" size={18} />
                        <label className="sr-only" htmlFor="store-search">
                            Search stores
                        </label>
                        <input
                            id="store-search"
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by store name or address..."
                        />
                        {search && (
                            <button
                                type="button"
                                className="search-clear"
                                onClick={() => setSearch('')}
                                aria-label="Clear search"
                            >
                                <span aria-hidden="true">×</span>
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {notice && (
                <div className="alert alert-success" role="status">
                    {notice}
                </div>
            )}
            {error && (
                <div className="alert alert-error" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <SkeletonCards count={3} />
            ) : stores.length === 0 ? (
                <div className="card empty-state">
                    <span className="empty-icon">
                        <Icon name="store" size={24} />
                    </span>
                    <h2>No stores found</h2>
                    <p>
                        {search
                            ? 'Try a different name or address.'
                            : 'No stores have been added yet.'}
                    </p>
                    {search && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setSearch('')}
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="list-head">
                        <div>
                            <h2>Stores in view</h2>
                            <p className="muted">
                                {search
                                    ? `Matching “${search.trim()}”`
                                    : 'Every store on the platform, ready for your rating.'}
                            </p>
                        </div>
                        <span className="chip">{stores.length} store(s)</span>
                    </div>

                    <div className="store-grid">
                        {stores.map((store) => {
                            const currentValue =
                                drafts[store.id] ?? store.myRating ?? 0;
                            const saving = savingId === store.id;

                            return (
                                <article className="card store-card" key={store.id}>
                                    <div className="store-card-head">
                                        <div className="store-identity">
                                            <span className="store-avatar store-avatar-lg">
                                                <Icon name="store" size={22} />
                                            </span>
                                            <div>
                                                <h2>{store.name}</h2>
                                                <p className="store-address">
                                                    <Icon
                                                        name="mapPin"
                                                        size={14}
                                                    />
                                                    {store.address}
                                                </p>
                                                <p className="store-email">
                                                    <Icon
                                                        name="mail"
                                                        size={14}
                                                    />
                                                    {store.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="store-average">
                                            <span className="rating-pill">
                                                {formatRating(
                                                    store.averageRating
                                                )}
                                            </span>
                                            <span className="muted">
                                                avg / 5
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rating-summary">
                                        <StarDisplay
                                            value={store.averageRating}
                                        />
                                        <span className="rating-summary-copy">
                                            <strong>
                                                {formatRating(
                                                    store.averageRating
                                                )}{' '}
                                                average
                                            </strong>
                                            <span className="muted">
                                                {Number(store.totalRatings) ||
                                                    0}{' '}
                                                rating(s)
                                            </span>
                                        </span>
                                    </div>

                                    <div className="your-rating-row">
                                        <div className="your-rating">
                                            <span className="your-rating-label">
                                                Your rating:
                                            </span>
                                            {store.myRating ? (
                                                <span className="your-rating-value">
                                                    {store.myRating} / 5
                                                </span>
                                            ) : (
                                                <span className="muted">
                                                    Not rated yet
                                                </span>
                                            )}
                                        </div>
                                        {store.myRating && (
                                            <span className="chip chip-soft">
                                                Rated
                                            </span>
                                        )}
                                    </div>

                                    <div className="rating-controls">
                                        <div className="rating-control-copy">
                                            <span>Set your rating</span>
                                            <StarInput
                                                value={currentValue}
                                                onChange={(value) =>
                                                    setDrafts((previous) => ({
                                                        ...previous,
                                                        [store.id]: value
                                                    }))
                                                }
                                                disabled={saving}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => submitRating(store)}
                                            disabled={
                                                saving ||
                                                (!drafts[store.id] &&
                                                    !store.myRating)
                                            }
                                        >
                                            {saving
                                                ? 'Saving...'
                                                : store.myRating
                                                  ? 'Update rating'
                                                  : 'Submit rating'}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
