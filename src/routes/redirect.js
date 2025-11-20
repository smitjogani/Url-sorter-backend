import express from 'express';
import { pool } from '../db/index.js';

const router = express.Router();

/**
 * GET /:code
 * Redirect to the target URL and increment click count
 */
router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;

        // Skip if it's a known route or static file extension
        const knownRoutes = ['api', 'healthz', 'code'];
        const staticExtensions = ['.html', '.css', '.js', '.ico', '.png', '.jpg', '.svg', '.json'];

        if (knownRoutes.includes(code) || staticExtensions.some(ext => code.endsWith(ext))) {
            return next();
        }

        // Validate code format (6-8 alphanumeric characters)
        const codeRegex = /^[A-Za-z0-9]{6,8}$/;
        if (!codeRegex.test(code)) {
            return next(); // Let 404 handler deal with invalid codes
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const selectRes = await client.query('SELECT id, url FROM links WHERE code = $1 FOR UPDATE', [code]);
            if (selectRes.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Link not found' });
            }

            const url = selectRes.rows[0].url;

            await client.query('UPDATE links SET clicks = clicks + 1, last_clicked = now(), updated_at = now() WHERE code = $1', [code]);
            await client.query('COMMIT');

            return res.redirect(302, url);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        next(error);
    }
});

export default router;

