import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState
} from 'react';

const TOKEN_KEY = 'srs_token';
const USER_KEY = 'srs_user';

const AuthContext = createContext(null);

export const HOME_BY_ROLE = {
    ADMIN: '/admin',
    USER: '/stores',
    OWNER: '/owner'
};

export function homeForRole(role) {
    return HOME_BY_ROLE[role] || '/login';
}

function readStoredUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState(readStoredUser);

    const login = useCallback((nextToken, nextUser) => {
        localStorage.setItem(TOKEN_KEY, nextToken);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setToken(nextToken);
        setUser(nextUser);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({
            token,
            user,
            isAuthenticated: Boolean(token && user),
            login,
            logout
        }),
        [token, user, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside an AuthProvider');
    }

    return context;
}
