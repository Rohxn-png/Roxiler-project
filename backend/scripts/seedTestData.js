const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcrypt');
const pool = require('../config/db');

const testAccounts = [
    {
        name: 'Administrator Test Account',
        email: 'admin.test@gmail.com',
        password: 'Admin@1234',
        address: 'Davanagere, Karnataka, India',
        role: 'ADMIN'
    },
    {
        name: 'Store Owner Demo Account',
        email: 'owner.demo@gmail.com',
        password: 'Owner@1234',
        address: 'Davanagere, Karnataka, India',
        role: 'OWNER'
    },
    {
        name: 'Normal User Test Account',
        email: 'normal.user@gmail.com',
        password: 'User@1234',
        address: 'Davanagere, Karnataka, India',
        role: 'USER'
    }
];

const demoStore = {
    name: 'Demo Store For Rating System',
    email: 'demo.store@gmail.com',
    address: 'Davanagere, Karnataka, India'
};

async function ensureUser(account) {
    const [existing] = await pool.execute(
        'SELECT id, email, role FROM users WHERE email = ?',
        [account.email]
    );

    if (existing.length > 0) {
        console.log(`EXISTS  ${account.role.padEnd(5)} ${account.email} (id ${existing[0].id})`);
        return existing[0];
    }

    const hashedPassword = await bcrypt.hash(account.password, 10);

    const [result] = await pool.execute(
        `INSERT INTO users (name, email, password, address, role)
         VALUES (?, ?, ?, ?, ?)`,
        [
            account.name,
            account.email,
            hashedPassword,
            account.address,
            account.role
        ]
    );

    console.log(`CREATED ${account.role.padEnd(5)} ${account.email} (id ${result.insertId})`);

    return { id: result.insertId, email: account.email, role: account.role };
}

async function ensureStore(ownerId) {
    const [existing] = await pool.execute(
        'SELECT id, name FROM stores WHERE email = ?',
        [demoStore.email]
    );

    if (existing.length > 0) {
        console.log(`EXISTS  STORE ${demoStore.email} (id ${existing[0].id})`);
        return existing[0];
    }

    const [result] = await pool.execute(
        `INSERT INTO stores (name, email, address, owner_id)
         VALUES (?, ?, ?, ?)`,
        [demoStore.name, demoStore.email, demoStore.address, ownerId]
    );

    console.log(`CREATED STORE ${demoStore.email} (id ${result.insertId})`);

    return { id: result.insertId, name: demoStore.name };
}

async function main() {
    const created = {};

    for (const account of testAccounts) {
        created[account.role] = await ensureUser(account);
    }

    await ensureStore(created.OWNER.id);

    console.log('\nTest login credentials:');
    console.log('  ADMIN : admin.test@gmail.com / Admin@1234');
    console.log('  OWNER : owner.demo@gmail.com / Owner@1234');
    console.log('  USER  : normal.user@gmail.com / User@1234');
}

main()
    .catch((error) => {
        console.error('Seed failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
