import { Navigate, useLocation } from 'react-router-dom';

import { homeForRole, useAuth } from '../auth.jsx';

export default function ProtectedRoute({ roles, children }) {
    const { token, user } = useAuth();
    const location = useLocation();

    if (!token || !user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to={homeForRole(user.role)} replace />;
    }

    return children;
}
