import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api.js';
import AuthLayout from '../components/AuthLayout.jsx';
import Icon from '../components/Icon.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

const initialForm = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: ''
};

export default function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const updateField = (field) => (event) => {
        setForm((previous) => ({
            ...previous,
            [field]: event.target.value
        }));
    };

    const passwordChecks = [
        {
            label: '8-16 characters',
            ok: form.password.length >= 8 && form.password.length <= 16
        },
        {
            label: 'One uppercase letter',
            ok: /[A-Z]/.test(form.password)
        },
        {
            label: 'One special character',
            ok: /[^A-Za-z0-9]/.test(form.password)
        },
        {
            label: 'Passwords match',
            ok:
                form.password.length > 0 &&
                form.password === form.confirmPassword
        }
    ];

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        const name = form.name.trim();
        const address = form.address.trim();

        if (name.length < 20 || name.length > 60) {
            setError('Name must be between 20 and 60 characters.');
            return;
        }

        if (address.length === 0 || address.length > 400) {
            setError('Address is required and cannot exceed 400 characters.');
            return;
        }

        if (!PASSWORD_PATTERN.test(form.password)) {
            setError(
                'Password must be 8-16 characters with at least one uppercase letter and one special character.'
            );
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            await api.signup({
                name,
                email: form.email.trim(),
                password: form.password,
                address
            });

            navigate('/login', {
                replace: true,
                state: {
                    message: 'Account created successfully. Please sign in.'
                }
            });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="auth-card auth-card-elevated auth-card-wide">
                <div className="auth-card-head">
                    <span className="auth-kicker">
                        <Icon name="sparkles" size={13} />
                        Join the platform
                    </span>
                    <h1>Create your account</h1>
                    <p>
                        Sign up as a normal user. Admin and owner accounts are
                        created by an administrator.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="stack">
                    <label className="field">
                        <span className="field-label-row">
                            <span>Full name</span>
                            <span className="field-counter">
                                {form.name.trim().length}/60
                            </span>
                        </span>
                        <input
                            type="text"
                            value={form.name}
                            onChange={updateField('name')}
                            placeholder="Your full name"
                            minLength={20}
                            maxLength={60}
                            autoComplete="name"
                            required
                        />
                        <span className="field-hint">
                            Between 20 and 60 characters.
                        </span>
                    </label>

                    <label className="field">
                        <span>Email address</span>
                        <div className="input-with-icon">
                            <Icon name="mail" size={17} />
                            <input
                                type="email"
                                value={form.email}
                                onChange={updateField('email')}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                    </label>

                    <div className="form-grid">
                        <label className="field">
                            <span>Password</span>
                            <PasswordInput
                                value={form.password}
                                onChange={updateField('password')}
                                placeholder="8-16 characters"
                                autoComplete="new-password"
                                minLength={8}
                                maxLength={16}
                            />
                        </label>

                        <label className="field">
                            <span>Confirm password</span>
                            <PasswordInput
                                value={form.confirmPassword}
                                onChange={updateField('confirmPassword')}
                                placeholder="Repeat password"
                                autoComplete="new-password"
                                minLength={8}
                                maxLength={16}
                            />
                        </label>
                    </div>

                    <ul
                        className="password-checklist"
                        aria-live="polite"
                        aria-label="Password requirements"
                    >
                        {passwordChecks.map((check) => (
                            <li
                                className={
                                    check.ok ? 'check-item ok' : 'check-item'
                                }
                                key={check.label}
                            >
                                <span className="check-icon">
                                    <Icon name="check" size={11} />
                                </span>
                                {check.label}
                            </li>
                        ))}
                    </ul>

                    <label className="field">
                        <span className="field-label-row">
                            <span>Address</span>
                            <span className="field-counter">
                                {form.address.trim().length}/400
                            </span>
                        </span>
                        <textarea
                            value={form.address}
                            onChange={updateField('address')}
                            placeholder="Your address"
                            rows={3}
                            maxLength={400}
                            autoComplete="street-address"
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading}
                    >
                        {loading ? (
                            'Creating account...'
                        ) : (
                            <>
                                Create account
                                <Icon name="arrowRight" size={17} />
                            </>
                        )}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </AuthLayout>
    );
}
