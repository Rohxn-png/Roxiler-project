import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import Icon from '../components/Icon.jsx';
import { LoadingState } from '../components/Loading.jsx';
import { formatDate, textOrDash } from '../utils.js';

const ROLE_DETAILS = {
    ADMIN: {
        title: 'Administrator',
        icon: 'shield',
        description:
            'Can manage every account and store, and can see platform-wide statistics.',
        permissions: [
            'Create users, owners and admins',
            'Create stores and assign owners',
            'Review platform-wide rating activity'
        ]
    },
    OWNER: {
        title: 'Store owner',
        icon: 'store',
        description:
            'Can view the stores assigned to this account and the customers who rated them.',
        permissions: [
            'See assigned store performance',
            'Review customer ratings',
            'Update account password'
        ]
    },
    USER: {
        title: 'Normal user',
        icon: 'user',
        description:
            'Can browse stores, search by name or address, and submit one rating per store.',
        permissions: [
            'Browse and search every store',
            'Submit or update a personal rating',
            'Update account password'
        ]
    }
};

export default function AdminUserDetails() {
    const { token } = useAuth();
    const { id } = useParams();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError('');

        api.getAdminUser(token, id)
            .then((data) => {
                if (active) {
                    setUser(data);
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

    const role = String(user?.role || 'USER').toLowerCase();
    const roleInfo = ROLE_DETAILS[user?.role] || ROLE_DETAILS.USER;

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Admin / Users</p>
                    <h1>User details</h1>
                    <p className="muted">
                        Review this account&apos;s identity, role and access.
                    </p>
                </div>
                <div className="heading-actions">
                    <Link className="btn btn-ghost" to="/admin/users">
                        <Icon
                            name="arrowRight"
                            size={16}
                            className="icon-flip"
                        />
                        Back to users
                    </Link>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <LoadingState label="Loading user..." />
            ) : (
                user && (
                    <>
                        <section className="profile-hero card">
                            <Avatar name={user.name} size="xl" />
                            <div className="profile-hero-text">
                                <div className="profile-hero-title">
                                    <h2>{user.name}</h2>
                                    <span
                                        className={`role-badge role-${role}`}
                                    >
                                        {user.role}
                                    </span>
                                </div>
                                <p>{user.email}</p>
                                <div className="profile-hero-meta">
                                    <span>
                                        <Icon name="mapPin" size={14} />
                                        {textOrDash(user.address)}
                                    </span>
                                    <span>
                                        <Icon name="calendar" size={14} />
                                        Member since{' '}
                                        {formatDate(user.created_at)}
                                    </span>
                                </div>
                            </div>
                            <span className="identity-chip">
                                Account #{user.id}
                            </span>
                        </section>

                        <div className="two-col">
                            <section className="card detail-card">
                                <div className="card-heading">
                                    <div>
                                        <h2>Account details</h2>
                                        <p className="muted">
                                            Read-only identity information.
                                        </p>
                                    </div>
                                    <span className="card-icon card-icon-blue">
                                        <Icon name="user" size={19} />
                                    </span>
                                </div>

                                <dl className="detail-grid">
                                    <div>
                                        <dt>User ID</dt>
                                        <dd>{user.id}</dd>
                                    </div>
                                    <div>
                                        <dt>Email</dt>
                                        <dd>{user.email}</dd>
                                    </div>
                                    <div>
                                        <dt>Role</dt>
                                        <dd>{user.role}</dd>
                                    </div>
                                    <div>
                                        <dt>Created at</dt>
                                        <dd>{formatDate(user.created_at)}</dd>
                                    </div>
                                    <div className="detail-full">
                                        <dt>Address</dt>
                                        <dd>{textOrDash(user.address)}</dd>
                                    </div>
                                </dl>
                            </section>

                            <section className="card detail-card">
                                <div className="card-heading">
                                    <div>
                                        <h2>Role &amp; access</h2>
                                        <p className="muted">
                                            What this account can do.
                                        </p>
                                    </div>
                                    <span className="card-icon card-icon-violet">
                                        <Icon name={roleInfo.icon} size={19} />
                                    </span>
                                </div>

                                <div
                                    className={`role-summary role-summary-${role}`}
                                >
                                    <span className="role-summary-icon">
                                        <Icon
                                            name={roleInfo.icon}
                                            size={20}
                                        />
                                    </span>
                                    <div>
                                        <strong>{roleInfo.title}</strong>
                                        <p>{roleInfo.description}</p>
                                    </div>
                                </div>

                                <ul className="capability-list">
                                    {roleInfo.permissions.map((permission) => (
                                        <li key={permission}>
                                            <span className="check-icon">
                                                <Icon
                                                    name="check"
                                                    size={11}
                                                />
                                            </span>
                                            {permission}
                                        </li>
                                    ))}
                                </ul>

                                <div className="security-tips">
                                    <div className="security-tip">
                                        <Icon name="shield" size={16} />
                                        <span>
                                            Role and account id come from the
                                            signed JWT, never from the URL.
                                        </span>
                                    </div>
                                    <div className="security-tip">
                                        <Icon name="lock" size={16} />
                                        <span>
                                            Passwords are bcrypt-hashed and are
                                            never returned by the API.
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
