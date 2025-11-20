import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

const startTime = Date.now();

/**
 * GET /healthz
 * Health check endpoint
 */
router.get('/', async (req, res) => {
    try {
        // Simple DB query to confirm connectivity
        await query('SELECT 1');

        const uptime = Math.floor((Date.now() - startTime) / 1000); // seconds

        res.status(200).json({
            ok: true,
            version: '1.0',
            uptime: uptime,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            ok: false,
            error: 'Database connection failed',
        });
    }
});

export default router;

