const API_BASE = (
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

async function request(path, { method = 'GET', token, body } = {}) {
    const headers = {};

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    } catch {
        throw new Error(
            'Cannot reach the API server. Make sure the backend is running.'
        );
    }

    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = { message: text };
        }
    }

    if (!response.ok) {
        const error = new Error(
            data?.message || `Request failed with status ${response.status}`
        );
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

function queryString(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            query.set(key, value);
        }
    });

    const serialized = query.toString();
    return serialized ? `?${serialized}` : '';
}

export const api = {
    login: (email, password) =>
        request('/auth/login', {
            method: 'POST',
            body: { email, password }
        }),

    signup: (payload) =>
        request('/auth/signup', {
            method: 'POST',
            body: payload
        }),

    getMyProfile: (token) => request('/users/me', { token }),

    updatePassword: (token, currentPassword, newPassword) =>
        request('/users/password', {
            method: 'PUT',
            token,
            body: { currentPassword, newPassword }
        }),

    getStores: (token, params) =>
        request(`/stores${queryString(params)}`, { token }),

    getStore: (token, id) => request(`/stores/${id}`, { token }),

    submitRating: (token, storeId, rating) =>
        request(`/stores/${storeId}/ratings`, {
            method: 'POST',
            token,
            body: { rating }
        }),

    getAdminDashboard: (token) => request('/admin/dashboard', { token }),

    getAdminUsers: (token, params) =>
        request(`/admin/users${queryString(params)}`, { token }),

    getAdminUser: (token, id) => request(`/admin/users/${id}`, { token }),

    createAdminUser: (token, payload) =>
        request('/admin/users', {
            method: 'POST',
            token,
            body: payload
        }),

    getAdminStores: (token, params) =>
        request(`/admin/stores${queryString(params)}`, { token }),

    getAdminStore: (token, id) => request(`/admin/stores/${id}`, { token }),

    createAdminStore: (token, payload) =>
        request('/admin/stores', {
            method: 'POST',
            token,
            body: payload
        }),

    getOwnerStores: (token) => request('/owner/stores', { token }),

    getOwnerStore: (token) => request('/owner/store', { token }),

    getOwnerRatings: (token) => request('/owner/ratings', { token })
};

export { API_BASE };
