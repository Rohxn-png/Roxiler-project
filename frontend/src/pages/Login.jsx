import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { api } from '../api.js';
import { homeForRole, useAuth } from '../auth.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Icon from '../components/Icon.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

const DEMO_ACCOUNTS = [
    {
        role: 'Admin',
        email: 'admin.test@gmail.com',
        password: 'Admin@1234',
        icon: 'shield'
    },
    {
        role: 'Owner',
        email: 'owner.demo@gmail.com',
        password: 'Owner@1234',
        icon: 'store'
    },
    {
        role: 'User',
        email: 'normal.user@gmail.com',
        password: 'User@1234',
        icon: 'user'
    }
];

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const successMessage = location.state?.message;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api.login(email.trim(), password);
            login(data.token, data.user);

            const destination =
                location.state?.from || homeForRole(data.user.role);

            navigate(destination, { replace: true });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (account) => {
        setEmail(account.email);
        setPassword(account.password);
        setError('');
        document.getElementById('login-submit')?.focus();
    };

    return (
        <AuthLayout>
            <div className="auth-card auth-card-elevated">
                <div className="auth-card-head">
                    <span className="auth-kicker">
                        <Icon name="lock" size={13} />
                        Secure sign in
                    </span>
                    <h1>Welcome back</h1>
                    <p>Sign in to continue to your role-based workspace.</p>
                </div>

                {successMessage && (
                    <div className="alert alert-success" role="status">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="stack">
                    <label className="field">
                        <span>Email address</span>
                        <div className="input-with-icon">
                            <Icon name="mail" size={17} />
                            <input
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                    </label>

                    <label className="field">
                        <span>Password</span>
                        <PasswordInput
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Enter your password"
                            autoComplete="current-password"
                        />
                    </label>

                    <div className="auth-form-row">
                        <span className="secure-note">
                            <Icon name="shield" size={13} />
                            JWT protected session
                        </span>
                        <Link to="/signup">Create account</Link>
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading}
                    >
                        {loading ? (
                            'Signing in...'
                        ) : (
                            <>
                                Sign in
                                <Icon name="arrowRight" size={17} />
                            </>
                        )}
                    </button>
                </form>

                {import.meta.env.DEV && (
                    <div className="demo-login">
                        <div className="demo-login-head">
                            <span>
                                <Icon name="sparkles" size={14} />
                                Quick demo sign-in
                            </span>
                            <span>Dev only</span>
                        </div>
                        <div className="demo-login-grid">
                            {DEMO_ACCOUNTS.map((account) => (
                                <button
                                    type="button"
                                    className="demo-account"
                                    key={account.role}
                                    onClick={() => fillDemo(account)}
                                >
                                    <span className="demo-account-role">
                                        <Icon name={account.icon} size={13} />
                                        {account.role}
                                    </span>
                                    <span className="demo-account-email">
                                        {account.email}
                                    </span>
                                    <Icon
                                        name="arrowRight"
                                        size={14}
                                        className="demo-account-arrow"
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="demo-login-hint">
                            Click a role to fill the form, then press Sign in.
                        </p>
                    </div>
                )}

                <p className="auth-switch">
                    New here? <Link to="/signup">Create an account</Link>
                </p>
            </div>
        </AuthLayout>
    );
}
