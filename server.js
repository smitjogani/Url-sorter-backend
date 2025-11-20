import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB, closeDB } from './src/db/index.js';
import linksRouter from './src/routes/links.js';
import redirectRouter from './src/routes/redirect.js';
import healthRouter from './src/routes/health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Security middleware
app.use(helmet());

// CORS configuration - allow frontend and localhost during development
const allowedOrigins = [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Otherwise block the request and provide a helpful message
        return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes (must come before redirect route)
app.use('/api/links', linksRouter);

// Health check route
app.use('/healthz', healthRouter);

// Redirect route (must come last to catch short codes)
app.use('/', redirectRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'production' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`Backend server running on ${BASE_URL}`);
            console.log(`Health check: ${BASE_URL}/healthz`);
            console.log(`Frontend URL: ${FRONTEND_URL}`);
        });

        server.on('error', async (err) => {
            if (err && err.code === 'EADDRINUSE') {
                console.error(`\u274c Port ${PORT} already in use. Please stop the other process or set PORT to a different value.`);
            } else {
                console.error('\u274c Server error:', err);
            }
            try {
                await closeDB();
            } catch (closeErr) {
                console.error('Error closing DB after server error:', closeErr);
            }
            process.exit(1);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        try {
            await closeDB();
        } catch (closeErr) {
            console.error('Error closing DB after startup failure:', closeErr);
        }
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await closeDB();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await closeDB();
    process.exit(0);
});

// Global error handlers to close DB and exit on fatal errors
process.on('uncaughtException', async (err) => {
    console.error('Uncaught Exception:', err);
    try {
        await closeDB();
    } catch (e) {
        console.error('Error closing DB after uncaughtException:', e);
    }
    process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
    console.error('Unhandled Rejection:', reason);
    try {
        await closeDB();
    } catch (e) {
        console.error('Error closing DB after unhandledRejection:', e);
    }
    process.exit(1);
});

