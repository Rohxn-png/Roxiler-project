import { Link } from 'react-router-dom';

import Icon from './Icon.jsx';
import { StarDisplay } from './Stars.jsx';

const FEATURES = [
    {
        icon: 'shield',
        title: 'Role-based security',
        description:
            'JWT sessions with dedicated ADMIN, OWNER and USER access.'
    },
    {
        icon: 'star',
        title: 'One rating per user',
        description:
            'Customers can update their rating without creating duplicates.'
    },
    {
        icon: 'chart',
        title: 'Live insights',
        description:
            'Owners and admins see averages and rating activity instantly.'
    }
];

export default function AuthLayout({ children }) {
    return (
        <div className="auth-shell">
            <aside className="auth-visual">
                <Link to="/login" className="brand brand-light">
                    <span className="brand-mark brand-mark-large">SR</span>
                    <span className="brand-text">Store Ratings</span>
                </Link>

                <div className="auth-visual-copy">
                    <span className="auth-pill">
                        <Icon name="sparkles" size={15} />
                        Store Rating System
                    </span>

                    <h1>
                        Honest feedback.
                        <br />
                        Better stores.
                    </h1>

                    <p>
                        One secure platform for admins, store owners and
                        customers to measure what matters.
                    </p>

                    <ul className="auth-features">
                        {FEATURES.map((feature) => (
                            <li key={feature.title}>
                                <span className="auth-feature-icon">
                                    <Icon name={feature.icon} size={18} />
                                </span>
                                <div>
                                    <strong>{feature.title}</strong>
                                    <span>{feature.description}</span>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="auth-preview" aria-hidden="true">
                        <div className="auth-preview-head">
                            <div>
                                <span className="auth-preview-label">
                                    Demo Store
                                </span>
                                <span className="auth-preview-sub">
                                    Davanagere, Karnataka
                                </span>
                            </div>
                            <span className="rating-pill">4.00</span>
                        </div>
                        <div className="auth-preview-stars">
                            <StarDisplay value={4} />
                            <span>1 rating</span>
                        </div>
                        <div className="auth-preview-bars">
                            <span style={{ width: '88%' }} />
                            <span style={{ width: '72%' }} />
                            <span style={{ width: '54%' }} />
                            <span style={{ width: '36%' }} />
                            <span style={{ width: '20%' }} />
                        </div>
                    </div>
                </div>

                <div className="auth-visual-footer">
                    Secure by design · bcrypt hashed passwords · parameterized
                    SQL
                </div>
            </aside>

            <main className="auth-panel">{children}</main>
        </div>
    );
}
