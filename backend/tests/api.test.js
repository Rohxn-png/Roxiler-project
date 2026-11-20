const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const PORT = Number(process.env.TEST_PORT || 5050);
const BASE_URL = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;
let serverProcess = null;
let serverOutput = '';

let adminToken = null;
let ownerToken = null;
let userToken = null;

let demoStoreId = null;
let demoOwnerId = null;
let freshStoreId = null;
let secondUserEmail = null;
let adminCreatedUserEmail = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function expect(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function test(name, fn) {
    try {
        await fn();
        passed += 1;
        console.log(`PASS  ${name}`);
    } catch (error) {
        failed += 1;
        console.error(`FAIL  ${name}`);
        console.error(`      ${error.message}`);
    }
}

async function request(method, route, { token, body } = {}) {
    const headers = {};

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${route}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });

    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = { raw: text };
        }
    }

    return { status: response.status, data };
}

async function login(email, password) {
    return request('POST', '/api/auth/login', {
        body: { email, password }
    });
}

async function startServer() {
    serverProcess = spawn(process.execPath, ['server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: String(PORT) },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (chunk) => {
        serverOutput += chunk.toString();
    });

    serverProcess.stderr.on('data', (chunk) => {
        serverOutput += chunk.toString();
    });

    const deadline = Date.now() + 25000;

    while (Date.now() < deadline) {
        try {
            const response = await fetch(`${BASE_URL}/`);

            if (response.ok) {
                return;
            }
        } catch {
            // Server is still starting
        }

        await sleep(300);
    }

    throw new Error(`Server did not start on port ${PORT}. ${serverOutput}`);
}

async function loadDemoData() {
    const [stores] = await pool.execute(
        'SELECT id, owner_id FROM stores WHERE email = ?',
        ['demo.store@gmail.com']
    );

    if (stores.length === 0) {
        throw new Error('Demo store missing. Run: npm run seed:test');
    }

    demoStoreId = stores[0].id;
    demoOwnerId = stores[0].owner_id;
}

async function cleanup() {
    try {
        if (freshStoreId) {
            await pool.execute('DELETE FROM stores WHERE id = ?', [freshStoreId]);
        }

        if (secondUserEmail) {
            await pool.execute('DELETE FROM users WHERE email = ?', [secondUserEmail]);
        }

        if (adminCreatedUserEmail) {
            await pool.execute('DELETE FROM users WHERE email = ?', [adminCreatedUserEmail]);
        }
    } catch (error) {
        console.error(`Cleanup warning: ${error.message}`);
    }

    try {
        await pool.end();
    } catch {
        // Ignore pool shutdown errors
    }
}

async function run() {
    await startServer();
    await loadDemoData();

    await test('Health check responds', async () => {
        const response = await request('GET', '/');
        expect(response.status === 200, `Expected 200, got ${response.status}`);
        expect(
            response.data && response.data.message,
            'Health response missing message'
        );
    });

    await test('Admin login works and does not expose password', async () => {
        const response = await login('admin.test@gmail.com', 'Admin@1234');
        expect(response.status === 200, `Expected 200, got ${response.status}`);
        expect(response.data.token, 'Admin token missing');
        expect(response.data.user.role === 'ADMIN', 'Admin role mismatch');
        expect(
            !('password' in response.data.user),
            'Password leaked in login response'
        );
        adminToken = response.data.token;
    });

    await test('Owner login works', async () => {
        const response = await login('owner.demo@gmail.com', 'Owner@1234');
        expect(response.status === 200, `Expected 200, got ${response.status}`);
        expect(response.data.user.role === 'OWNER', 'Owner role mismatch');
        ownerToken = response.data.token;
    });

    let userPassword = 'User@1234';
    let userLogin = await login('normal.user@gmail.com', userPassword);

    if (userLogin.status !== 200) {
        userPassword = 'User@5678';
        userLogin = await login('normal.user@gmail.com', userPassword);
    }

    await test('User login works', async () => {
        expect(
            userLogin.status === 200,
            'Cannot log in normal.user@gmail.com. Run npm run seed:test.'
        );
        expect(userLogin.data.user.role === 'USER', 'User role mismatch');
        userToken = userLogin.data.token;
    });

    await test('Protected routes reject missing and invalid tokens', async () => {
        const noToken = await request('GET', '/api/stores');
        expect(noToken.status === 401, `Missing token: expected 401, got ${noToken.status}`);

        const badToken = await request('GET', '/api/stores', {
            token: 'not-a-real-token'
        });
        expect(badToken.status === 401, `Invalid token: expected 401, got ${badToken.status}`);
    });

    await test('Protected and admin-test routes enforce roles', async () => {
        const protectedResponse = await request('GET', '/api/protected', {
            token: userToken
        });
        expect(protectedResponse.status === 200, `Expected 200, got ${protectedResponse.status}`);
        expect(
            !('password' in protectedResponse.data.user),
            'Password leaked in protected response'
        );

        const adminTestAsUser = await request('GET', '/api/admin-test', {
            token: userToken
        });
        expect(adminTestAsUser.status === 403, `Expected 403, got ${adminTestAsUser.status}`);

        const adminTestAsAdmin = await request('GET', '/api/admin-test', {
            token: adminToken
        });
        expect(adminTestAsAdmin.status === 200, `Expected 200, got ${adminTestAsAdmin.status}`);
    });

    await test('Admin dashboard, user and store listings work', async () => {
        const dashboard = await request('GET', '/api/admin/dashboard', {
            token: adminToken
        });
        expect(dashboard.status === 200, `Dashboard: expected 200, got ${dashboard.status}`);
        expect(
            typeof dashboard.data.totalUsers === 'number',
            'Dashboard totalUsers missing'
        );
        expect(
            typeof dashboard.data.totalStores === 'number',
            'Dashboard totalStores missing'
        );
        expect(
            typeof dashboard.data.totalRatings === 'number',
            'Dashboard totalRatings missing'
        );

        const users = await request('GET', '/api/admin/users', {
            token: adminToken
        });
        expect(users.status === 200, `Users: expected 200, got ${users.status}`);
        expect(Array.isArray(users.data), 'Users response is not an array');
        expect(
            users.data.every((user) => !('password' in user)),
            'Password leaked in admin users list'
        );

        const filteredUsers = await request(
            'GET',
            '/api/admin/users?role=USER&sortBy=name&order=DESC',
            { token: adminToken }
        );
        expect(filteredUsers.status === 200, `Filtered users: expected 200, got ${filteredUsers.status}`);
        expect(
            filteredUsers.data.every((user) => user.role === 'USER'),
            'User role filter failed'
        );

        const stores = await request('GET', '/api/admin/stores', {
            token: adminToken
        });
        expect(stores.status === 200, `Stores: expected 200, got ${stores.status}`);
        expect(Array.isArray(stores.data), 'Stores response is not an array');

        const storeDetails = await request(
            'GET',
            `/api/admin/stores/${demoStoreId}`,
            { token: adminToken }
        );
        expect(storeDetails.status === 200, `Store details: expected 200, got ${storeDetails.status}`);
        expect(storeDetails.data.name, 'Store details missing name');
        expect(
            Number(storeDetails.data.totalRatings) >= 0,
            'Store details missing totalRatings'
        );
    });

    await test('Admin input validation works', async () => {
        const shortName = await request('POST', '/api/admin/users', {
            token: adminToken,
            body: {
                name: 'Too Short',
                email: 'short.name@example.com',
                password: 'Valid@1234',
                address: 'Some address',
                role: 'USER'
            }
        });
        expect(shortName.status === 400, `Short name: expected 400, got ${shortName.status}`);

        const badEmail = await request('POST', '/api/admin/users', {
            token: adminToken,
            body: {
                name: 'Admin Created Test User Account',
                email: 'not-an-email',
                password: 'Valid@1234',
                address: 'Some address',
                role: 'USER'
            }
        });
        expect(badEmail.status === 400, `Bad email: expected 400, got ${badEmail.status}`);

        const weakPassword = await request('POST', '/api/admin/users', {
            token: adminToken,
            body: {
                name: 'Admin Created Test User Account',
                email: 'weak.password@example.com',
                password: 'weakpass',
                address: 'Some address',
                role: 'USER'
            }
        });
        expect(weakPassword.status === 400, `Weak password: expected 400, got ${weakPassword.status}`);

        const badRole = await request('POST', '/api/admin/users', {
            token: adminToken,
            body: {
                name: 'Admin Created Test User Account',
                email: 'bad.role@example.com',
                password: 'Valid@1234',
                address: 'Some address',
                role: 'SUPERADMIN'
            }
        });
        expect(badRole.status === 400, `Bad role: expected 400, got ${badRole.status}`);
    });

    await test('Admin can create a user', async () => {
        const timestamp = Date.now();
        adminCreatedUserEmail = `admin.created.${timestamp}@example.com`;

        const response = await request('POST', '/api/admin/users', {
            token: adminToken,
            body: {
                name: 'Admin Created Test User Account',
                email: adminCreatedUserEmail,
                password: 'Created@1234',
                address: 'Davanagere, Karnataka, India',
                role: 'USER'
            }
        });

        expect(response.status === 201, `Expected 201, got ${response.status}`);

        const details = await request(
            'GET',
            `/api/admin/users/${response.data.userId}`,
            { token: adminToken }
        );
        expect(details.status === 200, `Details: expected 200, got ${details.status}`);
        expect(details.data.email === adminCreatedUserEmail, 'Created user email mismatch');
        expect(!('password' in details.data), 'Password leaked in user details');
    });

    await test('Admin can create a store and validation is enforced', async () => {
        const timestamp = Date.now();
        const storeName = `Test Store ${timestamp}`;
        const storeEmail = `test.store.${timestamp}@example.com`;

        const invalidName = await request('POST', '/api/admin/stores', {
            token: adminToken,
            body: {
                name: 'Short',
                email: `short.store.${timestamp}@example.com`,
                address: 'Davanagere, Karnataka, India',
                owner_id: demoOwnerId
            }
        });
        expect(invalidName.status === 400, `Short store name: expected 400, got ${invalidName.status}`);

        const invalidOwner = await request('POST', '/api/admin/stores', {
            token: adminToken,
            body: {
                name: storeName,
                email: `bad.owner.${timestamp}@example.com`,
                address: 'Davanagere, Karnataka, India',
                owner_id: 999999
            }
        });
        expect(invalidOwner.status === 404, `Bad owner: expected 404, got ${invalidOwner.status}`);

        const response = await request('POST', '/api/admin/stores', {
            token: adminToken,
            body: {
                name: storeName,
                email: storeEmail,
                address: 'Davanagere, Karnataka, India',
                owner_id: demoOwnerId
            }
        });

        expect(response.status === 201, `Expected 201, got ${response.status}`);
        freshStoreId = response.data.storeId;

        const duplicate = await request('POST', '/api/admin/stores', {
            token: adminToken,
            body: {
                name: storeName,
                email: storeEmail,
                address: 'Davanagere, Karnataka, India',
                owner_id: demoOwnerId
            }
        });
        expect(duplicate.status === 409, `Duplicate store: expected 409, got ${duplicate.status}`);
    });

    await test('Admin routes reject USER and OWNER roles', async () => {
        const asUser = await request('GET', '/api/admin/dashboard', {
            token: userToken
        });
        expect(asUser.status === 403, `USER: expected 403, got ${asUser.status}`);

        const asOwner = await request('GET', '/api/admin/dashboard', {
            token: ownerToken
        });
        expect(asOwner.status === 403, `OWNER: expected 403, got ${asOwner.status}`);
    });

    await test('Signup validation and forced USER role work', async () => {
        const shortName = await request('POST', '/api/auth/signup', {
            body: {
                name: 'Short',
                email: `short.signup.${Date.now()}@example.com`,
                password: 'Valid@1234',
                address: 'Davanagere, Karnataka, India'
            }
        });
        expect(shortName.status === 400, `Short name: expected 400, got ${shortName.status}`);

        const badPassword = await request('POST', '/api/auth/signup', {
            body: {
                name: 'Second Normal User Account',
                email: `bad.password.${Date.now()}@example.com`,
                password: 'nouppercase1',
                address: 'Davanagere, Karnataka, India'
            }
        });
        expect(badPassword.status === 400, `Bad password: expected 400, got ${badPassword.status}`);

        const duplicate = await request('POST', '/api/auth/signup', {
            body: {
                name: 'Second Normal User Account',
                email: 'normal.user@gmail.com',
                password: 'Second@1234',
                address: 'Davanagere, Karnataka, India'
            }
        });
        expect(duplicate.status === 409, `Duplicate email: expected 409, got ${duplicate.status}`);

        const timestamp = Date.now();
        secondUserEmail = `second.user.${timestamp}@example.com`;

        const created = await request('POST', '/api/auth/signup', {
            body: {
                name: 'Second Normal User Account',
                email: secondUserEmail,
                password: 'Second@1234',
                address: 'Davanagere, Karnataka, India',
                role: 'ADMIN'
            }
        });
        expect(created.status === 201, `Signup: expected 201, got ${created.status}`);

        const secondLogin = await login(secondUserEmail, 'Second@1234');
        expect(secondLogin.status === 200, `Second login: expected 200, got ${secondLogin.status}`);
        expect(secondLogin.data.user.role === 'USER', 'Signup must always create USER role');
    });

    await test('User profile only returns the logged-in account', async () => {
        const response = await request('GET', '/api/users/me', {
            token: userToken
        });
        expect(response.status === 200, `Expected 200, got ${response.status}`);
        expect(response.data.email === 'normal.user@gmail.com', 'Profile email mismatch');
        expect(!('password' in response.data), 'Password leaked in profile');

        const adminProfile = await request('GET', '/api/users/me', {
            token: adminToken
        });
        expect(adminProfile.status === 200, `Admin profile: expected 200, got ${adminProfile.status}`);
        expect(adminProfile.data.role === 'ADMIN', 'Admin profile role mismatch');
    });

    await test('Password update validates input and current password', async () => {
        const missing = await request('PUT', '/api/users/password', {
            token: userToken,
            body: { newPassword: 'User@5678' }
        });
        expect(missing.status === 400, `Missing current: expected 400, got ${missing.status}`);

        const invalidNew = await request('PUT', '/api/users/password', {
            token: userToken,
            body: { currentPassword: userPassword, newPassword: 'weak' }
        });
        expect(invalidNew.status === 400, `Weak new password: expected 400, got ${invalidNew.status}`);

        const wrongCurrent = await request('PUT', '/api/users/password', {
            token: userToken,
            body: { currentPassword: 'Wrong@1234', newPassword: 'User@5678' }
        });
        expect(wrongCurrent.status === 401, `Wrong current: expected 401, got ${wrongCurrent.status}`);
    });

    await test('Password can be changed and new password works', async () => {
        const nextPassword = userPassword === 'User@1234' ? 'User@5678' : 'User@1234';

        const changed = await request('PUT', '/api/users/password', {
            token: userToken,
            body: {
                currentPassword: userPassword,
                newPassword: nextPassword
            }
        });
        expect(changed.status === 200, `Change: expected 200, got ${changed.status}`);

        const relogin = await login('normal.user@gmail.com', nextPassword);
        expect(relogin.status === 200, `Relogin: expected 200, got ${relogin.status}`);
        userToken = relogin.data.token;
        userPassword = nextPassword;

        if (userPassword !== 'User@1234') {
            const restored = await request('PUT', '/api/users/password', {
                token: userToken,
                body: {
                    currentPassword: userPassword,
                    newPassword: 'User@1234'
                }
            });
            expect(restored.status === 200, `Restore: expected 200, got ${restored.status}`);

            const finalLogin = await login('normal.user@gmail.com', 'User@1234');
            expect(finalLogin.status === 200, `Final login: expected 200, got ${finalLogin.status}`);
            userToken = finalLogin.data.token;
            userPassword = 'User@1234';
        }
    });

    await test('User store browsing, search and own rating work', async () => {
        const allStores = await request('GET', '/api/stores', {
            token: userToken
        });
        expect(allStores.status === 200, `Stores: expected 200, got ${allStores.status}`);
        expect(Array.isArray(allStores.data), 'Stores response is not an array');
        expect(
            allStores.data.every((store) => 'averageRating' in store && 'myRating' in store),
            'Store response missing rating fields'
        );

        const search = await request('GET', '/api/stores?search=Demo', {
            token: userToken
        });
        expect(search.status === 200, `Search: expected 200, got ${search.status}`);
        expect(
            search.data.some((store) => store.id === demoStoreId),
            'Demo store not found by search'
        );

        const addressSearch = await request(
            'GET',
            '/api/stores?address=Davanagere',
            { token: userToken }
        );
        expect(addressSearch.status === 200, `Address search: expected 200, got ${addressSearch.status}`);
        expect(addressSearch.data.length > 0, 'Address search returned no stores');

        const noResults = await request('GET', '/api/stores?search=zzzzzzzz', {
            token: userToken
        });
        expect(noResults.status === 200, `No results: expected 200, got ${noResults.status}`);
        expect(noResults.data.length === 0, 'No-results search returned stores');

        const injection = await request(
            'GET',
            `/api/stores?search=${encodeURIComponent("%' OR 1=1 --")}`,
            { token: userToken }
        );
        expect(injection.status === 200, `Injection search: expected 200, got ${injection.status}`);

        const details = await request('GET', `/api/stores/${demoStoreId}`, {
            token: userToken
        });
        expect(details.status === 200, `Details: expected 200, got ${details.status}`);
        expect(details.data.id === demoStoreId, 'Store details id mismatch');

        const missing = await request('GET', '/api/stores/999999', {
            token: userToken
        });
        expect(missing.status === 404, `Missing store: expected 404, got ${missing.status}`);
    });

    await test('Rating submit, update, validation and average calculation', async () => {
        const created = await request('POST', `/api/stores/${freshStoreId}/ratings`, {
            token: userToken,
            body: { rating: 5 }
        });
        expect(created.status === 201, `Create rating: expected 201, got ${created.status}`);
        expect(Number(created.data.averageRating) === 5, 'Average after first rating must be 5');
        expect(Number(created.data.totalRatings) === 1, 'Total ratings after first rating must be 1');

        const afterCreate = await request('GET', `/api/stores/${freshStoreId}`, {
            token: userToken
        });
        expect(afterCreate.data.myRating === 5, 'myRating after create must be 5');
        expect(Number(afterCreate.data.averageRating) === 5, 'Stored average must be 5');
        expect(Number(afterCreate.data.totalRatings) === 1, 'Stored total must be 1');

        const updated = await request('POST', `/api/stores/${freshStoreId}/ratings`, {
            token: userToken,
            body: { rating: 3 }
        });
        expect(updated.status === 200, `Update rating: expected 200, got ${updated.status}`);
        expect(Number(updated.data.averageRating) === 3, 'Average after update must be 3');
        expect(Number(updated.data.totalRatings) === 1, 'Update must not create a duplicate rating');

        const afterUpdate = await request('GET', `/api/stores/${freshStoreId}`, {
            token: userToken
        });
        expect(afterUpdate.data.myRating === 3, 'myRating after update must be 3');
        expect(Number(afterUpdate.data.totalRatings) === 1, 'Duplicate rating was created');

        const secondLogin = await login(secondUserEmail, 'Second@1234');
        expect(secondLogin.status === 200, `Second user login: expected 200, got ${secondLogin.status}`);

        const secondRating = await request('POST', `/api/stores/${freshStoreId}/ratings`, {
            token: secondLogin.data.token,
            body: { rating: 4 }
        });
        expect(secondRating.status === 201, `Second rating: expected 201, got ${secondRating.status}`);
        expect(Number(secondRating.data.averageRating) === 3.5, 'Average with two ratings must be 3.5');
        expect(Number(secondRating.data.totalRatings) === 2, 'Total with two ratings must be 2');

        for (const invalidRating of [0, 6, 3.5, 'abc', null, true, [3]]) {
            const invalid = await request(
                'POST',
                `/api/stores/${freshStoreId}/ratings`,
                { token: userToken, body: { rating: invalidRating } }
            );
            expect(
                invalid.status === 400,
                `Invalid rating ${JSON.stringify(invalidRating)}: expected 400, got ${invalid.status}`
            );
        }

        const missingStore = await request('POST', '/api/stores/999999/ratings', {
            token: userToken,
            body: { rating: 3 }
        });
        expect(missingStore.status === 404, `Missing store rating: expected 404, got ${missingStore.status}`);

        const adminRating = await request('POST', `/api/stores/${freshStoreId}/ratings`, {
            token: adminToken,
            body: { rating: 3 }
        });
        expect(adminRating.status === 403, `Admin rating: expected 403, got ${adminRating.status}`);

        const ownerRating = await request('POST', `/api/stores/${freshStoreId}/ratings`, {
            token: ownerToken,
            body: { rating: 3 }
        });
        expect(ownerRating.status === 403, `Owner rating: expected 403, got ${ownerRating.status}`);
    });

    await test('User and owner endpoints are role-protected', async () => {
        const storesAsAdmin = await request('GET', '/api/stores', {
            token: adminToken
        });
        expect(storesAsAdmin.status === 403, `Admin stores: expected 403, got ${storesAsAdmin.status}`);

        const storesAsOwner = await request('GET', '/api/stores', {
            token: ownerToken
        });
        expect(storesAsOwner.status === 403, `Owner stores: expected 403, got ${storesAsOwner.status}`);

        const ownerAsUser = await request('GET', '/api/owner/stores', {
            token: userToken
        });
        expect(ownerAsUser.status === 403, `User owner route: expected 403, got ${ownerAsUser.status}`);
    });

    await test('Owner sees own stores and ratings only', async () => {
        const stores = await request('GET', '/api/owner/stores', {
            token: ownerToken
        });
        expect(stores.status === 200, `Owner stores: expected 200, got ${stores.status}`);
        expect(Array.isArray(stores.data), 'Owner stores response is not an array');
        expect(
            stores.data.some((store) => store.id === demoStoreId),
            'Owner cannot see own demo store'
        );
        expect(
            stores.data.every((store) => 'averageRating' in store && 'totalRatings' in store),
            'Owner store stats missing'
        );

        const firstStore = await request('GET', '/api/owner/store', {
            token: ownerToken
        });
        expect(firstStore.status === 200, `Owner store: expected 200, got ${firstStore.status}`);
        expect(
            stores.data.some((store) => store.id === firstStore.data.id),
            'Owner store endpoint returned another owner store'
        );

        const ratings = await request('GET', '/api/owner/ratings', {
            token: ownerToken
        });
        expect(ratings.status === 200, `Owner ratings: expected 200, got ${ratings.status}`);
        expect(Array.isArray(ratings.data), 'Owner ratings response is not an array');

        const ownedIds = new Set(stores.data.map((store) => store.id));
        expect(
            ratings.data.every((rating) => ownedIds.has(rating.storeId)),
            'Owner ratings contain a store they do not own'
        );
        expect(
            ratings.data.every((rating) => !('password' in rating)),
            'Password leaked in owner ratings'
        );

        const freshRatings = ratings.data.filter(
            (rating) => rating.storeId === freshStoreId
        );
        expect(freshRatings.length === 2, 'Owner must see both ratings for own store');
        expect(
            freshRatings.some((rating) => rating.userEmail === 'normal.user@gmail.com'),
            'Owner ratings missing user email'
        );
        expect(
            freshRatings.some((rating) => rating.userEmail === secondUserEmail),
            'Owner ratings missing second user'
        );

        const otherStores = await pool.execute(
            'SELECT id, owner_id FROM stores WHERE owner_id <> ? LIMIT 1',
            [demoOwnerId]
        );

        if (otherStores[0].length > 0) {
            const otherStore = otherStores[0][0];
            const otherOwnerToken = jwt.sign(
                { id: otherStore.owner_id, role: 'OWNER' },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );

            const otherOwnerStores = await request('GET', '/api/owner/stores', {
                token: otherOwnerToken
            });
            expect(
                otherOwnerStores.status === 200,
                `Other owner stores: expected 200, got ${otherOwnerStores.status}`
            );
            expect(
                otherOwnerStores.data.some((store) => store.id === otherStore.id),
                'Other owner cannot see own store'
            );
            expect(
                otherOwnerStores.data.every((store) => store.id !== demoStoreId),
                'Owner isolation failed: other owner sees demo store'
            );

            const otherOwnerRatings = await request('GET', '/api/owner/ratings', {
                token: otherOwnerToken
            });
            expect(
                otherOwnerRatings.status === 200,
                `Other owner ratings: expected 200, got ${otherOwnerRatings.status}`
            );
            expect(
                otherOwnerRatings.data.every((rating) => rating.storeId !== demoStoreId),
                'Owner isolation failed: other owner sees demo ratings'
            );
        }
    });

    await test('Owner dashboard reflects user ratings', async () => {
        const rateDemo = await request('POST', `/api/stores/${demoStoreId}/ratings`, {
            token: userToken,
            body: { rating: 4 }
        });
        expect(rateDemo.status === 200 || rateDemo.status === 201, `Demo rating failed with ${rateDemo.status}`);

        const ratings = await request('GET', '/api/owner/ratings', {
            token: ownerToken
        });
        expect(ratings.status === 200, `Expected 200, got ${ratings.status}`);
        expect(
            ratings.data.some(
                (rating) =>
                    rating.storeId === demoStoreId &&
                    rating.userEmail === 'normal.user@gmail.com' &&
                    Number(rating.rating) === 4
            ),
            'Owner dashboard does not show the user rating'
        );
    });

    await test('Admin store details show aggregated ratings', async () => {
        const details = await request(
            'GET',
            `/api/admin/stores/${freshStoreId}`,
            { token: adminToken }
        );
        expect(details.status === 200, `Expected 200, got ${details.status}`);
        expect(Number(details.data.averageRating) === 3.5, 'Admin average must be 3.5');
        expect(Number(details.data.totalRatings) === 2, 'Admin total must be 2');
    });

    await test('No response leaks password hashes or JWT secret', async () => {
        const responses = await Promise.all([
            request('GET', '/api/users/me', { token: userToken }),
            request('GET', '/api/stores', { token: userToken }),
            request('GET', '/api/owner/ratings', { token: ownerToken }),
            request('GET', '/api/admin/users', { token: adminToken }),
            request('GET', '/api/admin/stores', { token: adminToken })
        ]);

        const serialized = JSON.stringify(responses);

        expect(!serialized.includes('$2b$'), 'bcrypt hash leaked in a response');
        expect(!serialized.includes('$2a$'), 'bcrypt hash leaked in a response');
        expect(
            !serialized.includes(process.env.JWT_SECRET),
            'JWT secret leaked in a response'
        );
        expect(!/"password"\s*:/.test(serialized), 'Password field leaked in a response');
    });
}

(async () => {
    try {
        await run();
    } catch (error) {
        failed += 1;
        console.error(`FATAL ${error.message}`);
    } finally {
        if (serverProcess) {
            serverProcess.kill();
            await sleep(500);
        }

        await cleanup();

        console.log(`\n${passed} passed, ${failed} failed`);

        if (failed > 0) {
            process.exitCode = 1;
        }
    }
})();
