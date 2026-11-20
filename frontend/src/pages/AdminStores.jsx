import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import { SkeletonTable } from '../components/Loading.jsx';
import { StarDisplay } from '../components/Stars.jsx';
import { formatRating } from '../utils.js';

const emptyFilters = {
    name: '',
    email: '',
    address: ''
};

const emptyStoreForm = {
    name: '',
    email: '',
    address: '',
    owner_id: ''
};

export default function AdminStores() {
    const { token } = useAuth();

    const [filters, setFilters] = useState(emptyFilters);
    const [applied, setApplied] = useState(emptyFilters);
    const [sortBy, setSortBy] = useState('name');
    const [order, setOrder] = useState('ASC');

    const [stores, setStores] = useState([]);
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [refreshKey, setRefreshKey] = useState(0);
    const [showCreate, setShowCreate] = useState(false);
    const [storeForm, setStoreForm] = useState(emptyStoreForm);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError('');

        api.getAdminStores(token, { ...applied, sortBy, order })
            .then((data) => {
                if (active) {
                    setStores(data);
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
    }, [token, applied, sortBy, order, refreshKey]);

    useEffect(() => {
        let active = true;

        api.getAdminUsers(token, {
            role: 'OWNER',
            sortBy: 'name',
            order: 'ASC'
        })
            .then((data) => {
                if (active) {
                    setOwners(data);
                }
            })
            .catch(() => {
                if (active) {
                    setOwners([]);
                }
            });

        return () => {
            active = false;
        };
    }, [token, refreshKey]);

    const updateFilter = (field) => (event) => {
        setFilters((previous) => ({
            ...previous,
            [field]: event.target.value
        }));
    };

    const updateStoreForm = (field) => (event) => {
        setStoreForm((previous) => ({
            ...previous,
            [field]: event.target.value
        }));
    };

    const handleFilterSubmit = (event) => {
        event.preventDefault();
        setApplied({ ...filters });
    };

    const resetFilters = () => {
        setFilters({ ...emptyFilters });
        setApplied({ ...emptyFilters });
        setSortBy('name');
        setOrder('ASC');
    };

    const handleCreateStore = async (event) => {
        event.preventDefault();
        setCreating(true);
        setError('');
        setNotice('');

        try {
            const data = await api.createAdminStore(token, {
                name: storeForm.name.trim(),
                email: storeForm.email.trim(),
                address: storeForm.address.trim(),
                owner_id: Number(storeForm.owner_id)
            });

            setNotice(
                `Store created successfully (ID ${data.storeId}) and assigned to owner ${data.ownerId}.`
            );
            setStoreForm(emptyStoreForm);
            setShowCreate(false);
            setRefreshKey((key) => key + 1);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setCreating(false);
        }
    };

    const ratedStores = stores.filter(
        (store) => Number(store.averageRating) > 0
    ).length;
    const unratedStores = stores.length - ratedStores;

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Admin / Stores</p>
                    <h1>Stores</h1>
                    <p className="muted">
                        Browse every store with its average rating and assign
                        new stores to owners.
                    </p>
                </div>
                <div className="heading-actions">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setShowCreate((value) => !value)}
                    >
                        <Icon name="store" size={16} />
                        {showCreate ? 'Close form' : 'Create store'}
                    </button>
                </div>
            </div>

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

            <div className="summary-strip">
                <div className="summary-chip">
                    <span className="summary-icon summary-icon-violet">
                        <Icon name="store" size={18} />
                    </span>
                    <div>
                        <strong className="summary-value">{stores.length}</strong>
                        <span className="summary-label">In current results</span>
                    </div>
                </div>
                <div className="summary-chip">
                    <span className="summary-icon summary-icon-amber">
                        <Icon name="star" size={18} filled />
                    </span>
                    <div>
                        <strong className="summary-value">{ratedStores}</strong>
                        <span className="summary-label">With ratings</span>
                    </div>
                </div>
                <div className="summary-chip">
                    <span className="summary-icon summary-icon-blue">
                        <Icon name="clock" size={18} />
                    </span>
                    <div>
                        <strong className="summary-value">{unratedStores}</strong>
                        <span className="summary-label">Awaiting ratings</span>
                    </div>
                </div>
            </div>

            {showCreate && (
                <form className="card form-card" onSubmit={handleCreateStore}>
                    <div className="card-heading">
                        <div>
                            <h2>Create store</h2>
                            <p className="muted">
                                Every store must be assigned to an OWNER
                                account.
                            </p>
                        </div>
                        <span className="card-icon card-icon-violet">
                            <Icon name="store" size={19} />
                        </span>
                    </div>

                    {owners.length === 0 && (
                        <div className="alert alert-warning">
                            No OWNER accounts found. Create an OWNER from the{' '}
                            <Link to="/admin/users">Users page</Link> first.
                        </div>
                    )}

                    <div className="form-grid">
                        <label className="field">
                            <span className="field-label-row">
                                <span>Store name</span>
                                <span className="field-counter">
                                    {storeForm.name.trim().length}/60
                                </span>
                            </span>
                            <input
                                type="text"
                                value={storeForm.name}
                                onChange={updateStoreForm('name')}
                                placeholder="Store name (20-60 characters)"
                                minLength={20}
                                maxLength={60}
                                required
                            />
                        </label>

                        <label className="field">
                            <span>Store email</span>
                            <input
                                type="email"
                                value={storeForm.email}
                                onChange={updateStoreForm('email')}
                                placeholder="store@example.com"
                                required
                            />
                        </label>

                        <label className="field">
                            <span>Owner</span>
                            <select
                                value={storeForm.owner_id}
                                onChange={updateStoreForm('owner_id')}
                                required
                            >
                                <option value="">Select an owner</option>
                                {owners.map((owner) => (
                                    <option key={owner.id} value={owner.id}>
                                        {owner.name} ({owner.email})
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className="field">
                        <span>Address</span>
                        <textarea
                            value={storeForm.address}
                            onChange={updateStoreForm('address')}
                            placeholder="Store address (maximum 400 characters)"
                            rows={2}
                            maxLength={400}
                            required
                        />
                    </label>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={creating || owners.length === 0}
                        >
                            {creating ? 'Creating...' : 'Create store'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setShowCreate(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <form className="card filter-card" onSubmit={handleFilterSubmit}>
                <div className="filter-head">
                    <span className="filter-title">
                        <Icon name="search" size={15} />
                        Filters
                    </span>
                    <span className="muted">
                        Combine fields to narrow the list
                    </span>
                </div>

                <div className="filter-grid">
                    <label className="field">
                        <span>Name</span>
                        <input
                            type="text"
                            value={filters.name}
                            onChange={updateFilter('name')}
                            placeholder="Search by store name"
                        />
                    </label>

                    <label className="field">
                        <span>Email</span>
                        <input
                            type="text"
                            value={filters.email}
                            onChange={updateFilter('email')}
                            placeholder="Search by store email"
                        />
                    </label>

                    <label className="field">
                        <span>Address</span>
                        <input
                            type="text"
                            value={filters.address}
                            onChange={updateFilter('address')}
                            placeholder="Search by address"
                        />
                    </label>

                    <label className="field">
                        <span>Sort by</span>
                        <select
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value)}
                        >
                            <option value="name">Name</option>
                            <option value="email">Email</option>
                            <option value="address">Address</option>
                            <option value="created_at">Created</option>
                        </select>
                    </label>

                    <label className="field">
                        <span>Order</span>
                        <select
                            value={order}
                            onChange={(event) => setOrder(event.target.value)}
                        >
                            <option value="ASC">Ascending</option>
                            <option value="DESC">Descending</option>
                        </select>
                    </label>
                </div>

                <div className="filter-actions">
                    <button type="submit" className="btn btn-primary">
                        Apply filters
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={resetFilters}
                    >
                        Reset
                    </button>
                </div>
            </form>

            <div className="card table-card">
                <div className="table-header">
                    <h2>All stores</h2>
                    <span className="muted">{stores.length} result(s)</span>
                </div>

                {loading ? (
                    <SkeletonTable rows={6} columns={5} />
                ) : stores.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">
                            <Icon name="store" size={22} />
                        </span>
                        <h3>No stores found</h3>
                        <p>Try adjusting or resetting the filters.</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Store</th>
                                    <th>Address</th>
                                    <th>Average rating</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stores.map((store) => (
                                    <tr key={store.id}>
                                        <td className="muted">#{store.id}</td>
                                        <td>
                                            <div className="table-user">
                                                <span className="store-avatar store-avatar-sm">
                                                    <Icon
                                                        name="store"
                                                        size={17}
                                                    />
                                                </span>
                                                <div>
                                                    <strong>{store.name}</strong>
                                                    <span>{store.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td
                                            className="cell-truncate"
                                            title={store.address}
                                        >
                                            {store.address || '-'}
                                        </td>
                                        <td>
                                            <div className="table-rating">
                                                <span className="rating-pill">
                                                    {formatRating(
                                                        store.averageRating
                                                    )}
                                                </span>
                                                <StarDisplay
                                                    value={store.averageRating}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <Link
                                                className="text-link"
                                                to={`/admin/stores/${store.id}`}
                                            >
                                                View
                                                <Icon
                                                    name="arrowRight"
                                                    size={13}
                                                />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
