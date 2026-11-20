import { Navigate, Route, Routes } from 'react-router-dom';

import { homeForRole, useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminStoreDetails from './pages/AdminStoreDetails.jsx';
import AdminStores from './pages/AdminStores.jsx';
import AdminUserDetails from './pages/AdminUserDetails.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import Profile from './pages/Profile.jsx';
import Signup from './pages/Signup.jsx';
import UserStores from './pages/UserStores.jsx';

function PublicOnly({ children }) {
    const { token, user } = useAuth();

    if (token && user) {
        return <Navigate to={homeForRole(user.role)} replace />;
    }

    return children;
}

function HomeRedirect() {
    const { user } = useAuth();
    return <Navigate to={user ? homeForRole(user.role) : '/login'} replace />;
}

export default function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <PublicOnly>
                        <Login />
                    </PublicOnly>
                }
            />
            <Route
                path="/signup"
                element={
                    <PublicOnly>
                        <Signup />
                    </PublicOnly>
                }
            />

            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<HomeRedirect />} />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute roles={['ADMIN']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute roles={['ADMIN']}>
                            <AdminUsers />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/users/:id"
                    element={
                        <ProtectedRoute roles={['ADMIN']}>
                            <AdminUserDetails />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/stores"
                    element={
                        <ProtectedRoute roles={['ADMIN']}>
                            <AdminStores />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/stores/:id"
                    element={
                        <ProtectedRoute roles={['ADMIN']}>
                            <AdminStoreDetails />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/stores"
                    element={
                        <ProtectedRoute roles={['USER']}>
                            <UserStores />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/owner"
                    element={
                        <ProtectedRoute roles={['OWNER']}>
                            <OwnerDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
