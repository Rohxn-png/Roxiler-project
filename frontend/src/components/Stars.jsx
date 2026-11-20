export function StarDisplay({ value }) {
    const numeric = Number(value) || 0;
    const rounded = Math.round(numeric);

    return (
        <span
            className="stars"
            aria-label={`${numeric.toFixed(2)} out of 5`}
            title={`${numeric.toFixed(2)} out of 5`}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={star <= rounded ? 'star filled' : 'star'}
                    aria-hidden="true"
                >
                    ★
                </span>
            ))}
        </span>
    );
}

export function StarInput({ value, onChange, disabled = false }) {
    const numeric = Number(value) || 0;

    return (
        <div className="star-input" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={numeric === star}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    className={
                        star <= numeric
                            ? 'star-button selected'
                            : 'star-button'
                    }
                    onClick={() => onChange(star)}
                    disabled={disabled}
                >
                    ★
                </button>
            ))}
        </div>
    );
}
