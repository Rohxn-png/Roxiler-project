import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth.jsx';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';

const NAV_LINKS = {
    ADMIN: [
        { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
        { to: '/admin/users', label: 'Users', icon: 'users' },
        { to: '/admin/stores', label: 'Stores', icon: 'store' }
    ],
    USER: [{ to: '/stores', label: 'Stores', icon: 'store' }],
    OWNER: [{ to: '/owner', label: 'My Store', icon: 'store' }]
};

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const links = NAV_LINKS[user?.role] || [];

    return (
        <div className="app-shell">
            <header className="navbar">
                <div className="navbar-inner">
                    <Link to="/" className="brand">
                        <span className="brand-mark">SR</span>
                        <span className="brand-text">Store Ratings</span>
                    </Link>

                    <nav className="nav-links" aria-label="Main navigation">
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                className={({ isActive }) =>
                                    isActive ? 'nav-link active' : 'nav-link'
                                }
                            >
                                <Icon name={link.icon} size={16} />
                                <span>{link.label}</span>
                            </NavLink>
                        ))}
                        <NavLink
                            to="/profile"
                            className={({ isActive }) =>
                                isActive ? 'nav-link active' : 'nav-link'
                            }
                        >
                            <Icon name="user" size={16} />
                            <span>Profile</span>
                        </NavLink>
                    </nav>

                    <div className="nav-user">
                        <div className="user-meta">
                            <Avatar name={user?.name} size="sm" />
                            <div className="user-text">
                                <span className="user-name" title={user?.name}>
                                    {user?.name}
                                </span>
                                <span
                                    className={`role-badge role-${String(
                                        user?.role || ''
                                    ).toLowerCase()}`}
                                >
                                    {user?.role}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-ghost btn-logout"
                            onClick={handleLogout}
                            aria-label="Logout"
                        >
                            <Icon name="logout" size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="main-content">
                <div className="container">
                    <Outlet />
                </div>
            </main>

            <footer className="footer">
                <div className="container footer-inner">
                    <span>Store Rating System · Full Stack Coding Challenge</span>
                    <span className="footer-note">
                        <Icon name="shield" size={13} />
                        Secure JWT access · bcrypt passwords
                    </span>
                </div>
            </footer>
        </div>
    );
}
