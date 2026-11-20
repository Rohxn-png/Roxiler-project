export function LoadingState({ label = 'Loading...' }) {
    return (
        <div className="loading-state" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}

export function SkeletonCards({ count = 3 }) {
    return (
        <div className="store-grid" aria-hidden="true">
            {Array.from({ length: count }).map((_, index) => (
                <div className="card skeleton-card" key={index}>
                    <div className="skeleton skeleton-line w-60" />
                    <div className="skeleton skeleton-line w-90" />
                    <div className="skeleton skeleton-block" />
                    <div className="skeleton skeleton-line w-40" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5, columns = 5 }) {
    return (
        <div className="skeleton-table" aria-hidden="true">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    className="skeleton-table-row"
                    style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
                    }}
                    key={rowIndex}
                >
                    {Array.from({ length: columns }).map((__, columnIndex) => (
                        <span
                            className="skeleton skeleton-line"
                            key={columnIndex}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
