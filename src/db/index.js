import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('\u274c DATABASE_URL is not set in environment');
    throw new Error('Missing DATABASE_URL');
}

// Neon requires SSL; some environments need rejectUnauthorized: false
const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});

pool.on('connect', () => {
    console.log('\u2705 Postgres (Neon) pool connected');
});

pool.on('error', (err) => {
    console.error('\u274c Postgres pool error:', err);
});

export async function query(text, params) {
    return pool.query(text, params);
}

export { pool };

export async function closeDB() {
    await pool.end();
    console.log('Postgres pool closed');
}

/**
 * Establish a test connection to the database and verify connectivity.
 * This is used by server startup to fail fast if DATABASE_URL is invalid.
 */
export async function connectDB() {
    try {
        // run a lightweight query
        await pool.query('SELECT 1');
        console.log('\u2705 Database connection verified');
    } catch (err) {
        console.error('\u274c Failed to connect to database:', err.message || err);
        throw err;
    }
}

