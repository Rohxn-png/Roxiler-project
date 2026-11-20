import { useEffect, useState } from 'react';

import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import Icon from '../components/Icon.jsx';
import PasswordForm from '../components/PasswordForm.jsx';
import { LoadingState } from '../components/Loading.jsx';
import { formatDate, textOrDash } from '../utils.js';

export default function Profile() {
    const { token, user } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError('');

        api.getMyProfile(token)
            .then((data) => {
                if (active) {
                    setProfile(data);
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

    const account = profile || user;

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Account</p>
                    <h1>Your profile</h1>
                    <p className="muted">
                        Review your account details and manage your password.
                    </p>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" role="alert">
                    {error}
                </div>
            )}

            <section className="profile-hero card">
                <Avatar name={account?.name} size="xl" />
                <div className="profile-hero-text">
                    <div className="profile-hero-title">
                        <h2>{account?.name}</h2>
                        <span
                            className={`role-badge role-${String(
                                account?.role || ''
                            ).toLowerCase()}`}
                        >
                            {account?.role}
                        </span>
                    </div>
                    <p>{account?.email}</p>
                    <div className="profile-hero-meta">
                        <span>
                            <Icon name="mapPin" size={14} />
                            {textOrDash(account?.address)}
                        </span>
                        <span>
                            <Icon name="calendar" size={14} />
                            Member since {formatDate(account?.created_at)}
                        </span>
                    </div>
                </div>
            </section>

            <div className="two-col">
                <div className="card detail-card">
                    <div className="card-heading">
                        <div>
                            <h2>Account details</h2>
                            <p className="muted">
                                Information tied to your JWT session.
                            </p>
                        </div>
                        <span className="card-icon card-icon-blue">
                            <Icon name="user" size={19} />
                        </span>
                    </div>

                    {loading ? (
                        <LoadingState label="Loading profile..." />
                    ) : (
                        <dl className="detail-grid">
                            <div>
                                <dt>User ID</dt>
                                <dd>{account?.id}</dd>
                            </div>
                            <div>
                                <dt>Email</dt>
                                <dd>{account?.email}</dd>
                            </div>
                            <div>
                                <dt>Role</dt>
                                <dd>{account?.role}</dd>
                            </div>
                            <div>
                                <dt>Member since</dt>
                                <dd>{formatDate(account?.created_at)}</dd>
                            </div>
                            <div className="detail-full">
                                <dt>Address</dt>
                                <dd>{textOrDash(account?.address)}</dd>
                            </div>
                        </dl>
                    )}

                    <div className="security-tips">
                        <div className="security-tip">
                            <Icon name="shield" size={16} />
                            <span>
                                Your role and account id come from the signed
                                JWT, never from the URL.
                            </span>
                        </div>
                        <div className="security-tip">
                            <Icon name="lock" size={16} />
                            <span>
                                Passwords are hashed with bcrypt and are never
                                returned by the API.
                            </span>
                        </div>
                    </div>
                </div>

                <PasswordForm />
            </div>
        </div>
    );
}
