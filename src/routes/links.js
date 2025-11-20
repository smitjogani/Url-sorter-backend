import express from 'express';
import { query } from '../db/index.js';
import { isValidUrl, isValidCode, generateRandomCode } from '../utils/validation.js';

const router = express.Router();

/**
 * POST /api/links
 * Create a new short link
 */
router.post('/', async (req, res, next) => {
    try {
        const { url, code: customCode } = req.body;

        // Validate URL
        if (!url || !isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL. Must be a valid HTTP/HTTPS URL.' });
        }

        let code = customCode;

        // If custom code provided, validate it
        if (code) {
            if (!isValidCode(code)) {
                return res.status(400).json({
                    error: 'Invalid code. Code must be 6-8 characters and contain only letters and numbers.'
                });
            }
        } else {
            // Generate random code
            code = generateRandomCode();
        }

        // Check if code already exists
        const checkRes = await query('SELECT id FROM links WHERE code = $1', [code]);
        if (checkRes.rowCount > 0) {
            return res.status(409).json({ error: 'Code already exists' });
        }

        // Insert new link
        const insertRes = await query(
            `INSERT INTO links(code, url, clicks, created_at, updated_at)
             VALUES($1, $2, 0, now(), now()) RETURNING id, code, url, clicks, last_clicked, created_at`,
            [code, url]
        );

        const row = insertRes.rows[0];

        res.status(201).json({
            id: row.id,
            code: row.code,
            url: row.url,
            clicks: row.clicks,
            lastClicked: row.last_clicked,
            createdAt: row.created_at,
        });
    } catch (error) {
        // Handle duplicate key error (Postgres unique violation)
        // Postgres unique violation code is '23505'
        if (error && error.code === '23505') {
            return res.status(409).json({ error: 'Code already exists' });
        }
        next(error);
    }
});

/**
 * GET /api/links
 * Get all links
 */
router.get('/', async (req, res, next) => {
    try {
        const { search } = req.query;
        // Build query
        let sql = 'SELECT id, code, url, clicks, last_clicked, created_at FROM links';
        const params = [];
        if (search) {
            sql += ' WHERE code ILIKE $1 OR url ILIKE $1';
            params.push(`%${search}%`);
        }
        sql += ' ORDER BY created_at DESC';

        const { rows } = await query(sql, params);

        const formatted = rows.map(r => ({
            id: r.id,
            code: r.code,
            url: r.url,
            clicks: r.clicks,
            lastClicked: r.last_clicked,
            createdAt: r.created_at,
        }));

        res.json(formatted);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/links/:code
 * Get stats for a specific link
 */
router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { rows } = await query('SELECT id, code, url, clicks, last_clicked, created_at FROM links WHERE code = $1', [code]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Link not found' });
        }
        const link = rows[0];

        res.json({
            id: link.id,
            code: link.code,
            url: link.url,
            clicks: link.clicks,
            lastClicked: link.last_clicked,
            createdAt: link.created_at,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/links/:code
 * Delete a link
 */
router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = await query('DELETE FROM links WHERE code = $1', [code]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Link not found' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;

