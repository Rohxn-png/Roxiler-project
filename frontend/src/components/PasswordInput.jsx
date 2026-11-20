import { useState } from 'react';

import Icon from './Icon.jsx';

export default function PasswordInput({
    id,
    value,
    onChange,
    placeholder,
    autoComplete,
    minLength,
    maxLength,
    required = true
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="input-with-action">
            <input
                id={id}
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                minLength={minLength}
                maxLength={maxLength}
                required={required}
            />
            <button
                type="button"
                className="input-action"
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
            >
                <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
            </button>
        </div>
    );
}
