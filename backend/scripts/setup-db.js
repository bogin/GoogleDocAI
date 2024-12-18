// scripts/setup-db.js
const { Client } = require('pg');

async function setupDatabase() {
    // First connect to default 'postgres' database
    const adminClient = new Client({
        user: 'postgres',
        host: 'localhost',
        password: 'postgres',
        database: 'postgres', // Connect to default database first
        port: 5432
    });

    try {
        await adminClient.connect();
        
        // Create user if not exists
        try {
            await adminClient.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'unframe_user') THEN
                        CREATE USER unframe_user WITH PASSWORD 'unframe_password';
                    END IF;
                END
                $$;
            `);
            console.log('User check/creation completed');
        } catch (err) {
            console.log('User creation error:', err.message);
        }

        // Check if database exists
        const dbCheckResult = await adminClient.query(`
            SELECT 1 FROM pg_database WHERE datname = 'unframe_dev'
        `);

        // Create database if it doesn't exist
        if (dbCheckResult.rows.length === 0) {
            // Disconnect all users from the database if it exists
            await adminClient.query(`
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = 'unframe_dev'
                AND pid <> pg_backend_pid();
            `).catch(() => {});

            await adminClient.query(`CREATE DATABASE unframe_dev`);
            console.log('Database created successfully');
        } else {
            console.log('Database already exists');
        }

        // Reconnect to the new database to grant privileges
        await adminClient.end();

        const dbClient = new Client({
            user: 'postgres',
            password: 'postgres',
            host: 'localhost',
            database: 'unframe_dev',
            port: 5432
        });

        await dbClient.connect();
        await dbClient.query(`
            GRANT ALL PRIVILEGES ON DATABASE unframe_dev TO unframe_user;
            GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO unframe_user;
            GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO unframe_user;
        `);

        console.log('Privileges granted successfully');
        await dbClient.end();

    } catch (error) {
        console.error('Setup error:', error.message);
        throw error;
    } finally {
        try {
            await adminClient.end();
        } catch {} 
    }
}

setupDatabase().catch(console.error);