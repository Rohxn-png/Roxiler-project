import { useState } from 'react';

import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icon from './Icon.jsx';
import PasswordInput from './PasswordInput.jsx';

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

export default function PasswordForm() {
    const { token } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [saving, setSaving] = useState(false);

    const checks = [
        {
            label: '8-16 characters',
            ok: newPassword.length >= 8 && newPassword.length <= 16
        },
        {
            label: 'Uppercase letter',
            ok: /[A-Z]/.test(newPassword)
        },
        {
            label: 'Special character',
            ok: /[^A-Za-z0-9]/.test(newPassword)
        },
        {
            label: 'Passwords match',
            ok: newPassword.length > 0 && newPassword === confirmPassword
        }
    ];

    const handleSubmit = async (event) => {
        event.preventDefault();
        setStatus({ type: '', message: '' });

        if (!PASSWORD_PATTERN.test(newPassword)) {
            setStatus({
                type: 'error',
                message:
                    'New password must be 8-16 characters with at least one uppercase letter and one special character.'
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatus({
                type: 'error',
                message: 'New passwords do not match.'
            });
            return;
        }

        setSaving(true);

        try {
            const data = await api.updatePassword(
                token,
                currentPassword,
                newPassword
            );

            setStatus({ type: 'success', message: data.message });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="card form-card" onSubmit={handleSubmit}>
            <div className="card-heading">
                <div>
                    <h2>Update password</h2>
                    <p className="muted">
                        Keep your account secure with a strong password.
                    </p>
                </div>
                <span className="card-icon card-icon-violet">
                    <Icon name="key" size={19} />
                </span>
            </div>

            {status.message && (
                <div
                    className={`alert alert-${status.type}`}
                    role={status.type === 'error' ? 'alert' : 'status'}
                >
                    {status.message}
                </div>
            )}

            <label className="field">
                <span>Current password</span>
                <PasswordInput
                    value={currentPassword}
                    onChange={(event) =>
                        setCurrentPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    placeholder="Enter current password"
                />
            </label>

            <label className="field">
                <span>New password</span>
                <PasswordInput
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="8-16 characters"
                    minLength={8}
                    maxLength={16}
                />
            </label>

            <label className="field">
                <span>Confirm new password</span>
                <PasswordInput
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                    minLength={8}
                    maxLength={16}
                />
            </label>

            <ul
                className="password-checklist"
                aria-live="polite"
                aria-label="Password requirements"
            >
                {checks.map((check) => (
                    <li
                        className={check.ok ? 'check-item ok' : 'check-item'}
                        key={check.label}
                    >
                        <span className="check-icon">
                            <Icon name="check" size={11} />
                        </span>
                        {check.label}
                    </li>
                ))}
            </ul>

            <button type="submit" className="btn btn-primary" disabled={saving}>
                <Icon name="key" size={16} />
                {saving ? 'Updating...' : 'Update password'}
            </button>
        </form>
    );
}
