import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function run() {
    try {
        const sqlPath = path.resolve(process.cwd(), 'migrations/001_create_links.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running migration:', sqlPath);
        await pool.query(sql);
        console.log('\u2705 Migration applied successfully');
    } catch (err) {
        console.error('\u274c Migration failed:', err.message || err);
        process.exitCode = 2;
    } finally {
        await pool.end();
    }
}

run();
