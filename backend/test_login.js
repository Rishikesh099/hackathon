const db = require('../database/db');

async function test() {
    const email = 'agent_student@gmail.com';
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        console.log('Query Succeeded, users count:', users.length);
    } catch (err) {
        console.error('Query Failed:', err.stack);
    } finally {
        process.exit(0);
    }
}

test();
