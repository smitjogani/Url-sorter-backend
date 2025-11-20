# TinyLink Backend

Node.js + Express backend API using Postgres (compatible with Neon).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```env
   # Set your Postgres/Neon connection string here
   DATABASE_URL=postgresql://username:password@host:5432/database
   PORT=5000
   NODE_ENV=development
   BASE_URL=http://localhost:5000
   FRONTEND_URL=http://localhost:3000
   ```

3. Start server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## API Endpoints

- `POST /api/links` - Create link
- `GET /api/links` - List all links
- `GET /api/links/:code` - Get link stats
- `DELETE /api/links/:code` - Delete link
- `GET /:code` - Redirect (302)
- `GET /healthz` - Health check

## Postgres / Neon

This backend uses Postgres via `pg` and expects `DATABASE_URL` to be set in the environment. For Neon, use the provided connection string and ensure SSL is enabled (Neon usually requires SSL by default).

