import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import Icon from '../components/Icon.jsx';
import { SkeletonTable } from '../components/Loading.jsx';

const emptyFilters = {
    name: '',
    email: '',
    address: '',
    role: ''
};

const emptyUserForm = {
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'USER'
};

export default function AdminUsers() {
    const { token } = useAuth();

    const [filters, setFilters] = useState(emptyFilters);
    const [applied, setApplied] = useState(emptyFilters);
    const [sortBy, setSortBy] = useState('name');
    const [order, setOrder] = useState('ASC');

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [refreshKey, setRefreshKey] = useState(0);
    const [showCreate, setShowCreate] = useState(false);
    const [userForm, setUserForm] = useState(emptyUserForm);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError('');

        api.getAdminUsers(token, { ...applied, sortBy, order })
            .then((data) => {
                if (active) {
                    setUsers(data);
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

    const updateFilter = (field) => (event) => {
        setFilters((previous) => ({
            ...previous,
            [field]: event.target.value
        }));
    };

    const updateUserForm = (field) => (event) => {
        setUserForm((previous) => ({
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

    const handleCreateUser = async (event) => {
        event.preventDefault();
        setCreating(true);
        setError('');
        setNotice('');

        try {
            const data = await api.createAdminUser(token, {
                ...userForm,
                name: userForm.name.trim(),
                email: userForm.email.trim(),
                address: userForm.address.trim()
            });

            setNotice(`User created successfully (ID ${data.userId}).`);
            setUserForm(emptyUserForm);
            setShowCreate(false);
            setRefreshKey((key) => key + 1);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setCreating(false);
        }
    };

    const admins = users.filter((user) => user.role === 'ADMIN').length;
    const owners = users.filter((user) => user.role === 'OWNER').length;
    const customers = users.filter((user) => user.role === 'USER').length;

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Admin / Users</p>
                    <h1>Users</h1>
                    <p className="muted">
                        Filter, sort and inspect every account. Create new
                        admins, users or store owners.
                    </p>
                </div>
                <div className="heading-actions">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setShowCreate((value) => !value)}
                    >
                        <Icon name="users" size={16} />
                        {showCreate ? 'Close form' : 'Create user'}
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
                    <span className="summary-icon summary-icon-blue">
                        <Icon name="users" size={18} />
                    </span>
                    <div>
                        <strong className="summary-value">{users.length}</strong>
                        <span className="summary-label">In current results</span>
                    </div>
                </div>
                <div className="summary-chip">
                    <span className="summary-icon summary-icon-rose">
                        <Icon name="shield" size={18} />
                    </span>
                    <div>
                        <strong className="summary-value">{admins}</strong>
                        <span className="summary-label">Admins</span>
                    </div>
                </div>
                <div className="summary-chip">
                    <span className="summary-icon summary-icon-violet">
                        <Icon name="store" size={18} />
                    </span>
                    <div>
                        <strong className="summary-value">{owners}</strong>
                        <span className="summary-label">Owners</span>
                    </div>
                </div>
                <div className="summary-chip">
                    <span className="summary-icon summary-icon-emerald">
                        <Icon name="user" size={18} />
                    </span>
                    <div>
                        <strong className="summary-value">{customers}</strong>
                        <span className="summary-label">Customers</span>
                    </div>
                </div>
            </div>

            {showCreate && (
                <form className="card form-card" onSubmit={handleCreateUser}>
                    <div className="card-heading">
                        <div>
                            <h2>Create user</h2>
                            <p className="muted">
                                New accounts can be admins, owners or normal
                                users.
                            </p>
                        </div>
                        <span className="card-icon card-icon-blue">
                            <Icon name="user" size={19} />
                        </span>
                    </div>

                    <div className="form-grid">
                        <label className="field">
                            <span className="field-label-row">
                                <span>Name</span>
                                <span className="field-counter">
                                    {userForm.name.trim().length}/60
                                </span>
                            </span>
                            <input
                                type="text"
                                value={userForm.name}
                                onChange={updateUserForm('name')}
                                placeholder="Full name (20-60 characters)"
                                minLength={20}
                                maxLength={60}
                                required
                            />
                        </label>

                        <label className="field">
                            <span>Email</span>
                            <input
                                type="email"
                                value={userForm.email}
                                onChange={updateUserForm('email')}
                                placeholder="user@example.com"
                                required
                            />
                        </label>

                        <label className="field">
                            <span>Password</span>
                            <input
                                type="password"
                                value={userForm.password}
                                onChange={updateUserForm('password')}
                                placeholder="8-16 characters"
                                minLength={8}
                                maxLength={16}
                                autoComplete="new-password"
                                required
                            />
                        </label>

                        <label className="field">
                            <span>Role</span>
                            <select
                                value={userForm.role}
                                onChange={updateUserForm('role')}
                                required
                            >
                                <option value="USER">USER</option>
                                <option value="OWNER">OWNER</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </label>
                    </div>

                    <label className="field">
                        <span>Address</span>
                        <textarea
                            value={userForm.address}
                            onChange={updateUserForm('address')}
                            placeholder="Address (maximum 400 characters)"
                            rows={2}
                            maxLength={400}
                            required
                        />
                    </label>

                    <p className="field-hint">
                        Password needs at least one uppercase letter and one
                        special character.
                    </p>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={creating}
                        >
                            {creating ? 'Creating...' : 'Create user'}
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
                            placeholder="Search by name"
                        />
                    </label>

                    <label className="field">
                        <span>Email</span>
                        <input
                            type="text"
                            value={filters.email}
                            onChange={updateFilter('email')}
                            placeholder="Search by email"
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
                        <span>Role</span>
                        <select
                            value={filters.role}
                            onChange={updateFilter('role')}
                        >
                            <option value="">All roles</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="USER">USER</option>
                            <option value="OWNER">OWNER</option>
                        </select>
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
                            <option value="role">Role</option>
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
                    <h2>All users</h2>
                    <span className="muted">{users.length} result(s)</span>
                </div>

                {loading ? (
                    <SkeletonTable rows={6} columns={5} />
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">
                            <Icon name="users" size={22} />
                        </span>
                        <h3>No users found</h3>
                        <p>Try adjusting or resetting the filters.</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Address</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="muted">#{user.id}</td>
                                        <td>
                                            <div className="table-user">
                                                <Avatar
                                                    name={user.name}
                                                    size="sm"
                                                />
                                                <div>
                                                    <strong>{user.name}</strong>
                                                    <span>{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td
                                            className="cell-truncate"
                                            title={user.address}
                                        >
                                            {user.address || '-'}
                                        </td>
                                        <td>
                                            <span
                                                className={`role-badge role-${String(
                                                    user.role
                                                ).toLowerCase()}`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <Link
                                                className="text-link"
                                                to={`/admin/users/${user.id}`}
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
