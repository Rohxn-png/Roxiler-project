import { Link } from 'react-router-dom';

import { homeForRole, useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';

export default function NotFound() {
    const { token, user } = useAuth();
    const destination = token && user ? homeForRole(user.role) : '/login';

    return (
        <div className="auth-page">
            <div className="auth-card auth-card-elevated not-found-card">
                <span className="brand-mark brand-mark-large">SR</span>
                <span className="auth-kicker">
                    <Icon name="alertTriangle" size={13} />
                    404
                </span>
                <h1>Page not found</h1>
                <p className="muted">
                    The page you are looking for does not exist or was moved.
                </p>
                <Link className="btn btn-primary btn-block" to={destination}>
                    Go to your dashboard
                    <Icon name="arrowRight" size={16} />
                </Link>
            </div>
        </div>
    );
}
