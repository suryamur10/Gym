import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { db } from './db.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'gymrank-api' }));
app.use('/api/auth', authRoutes);

// 404 + error handlers
app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'server_error', message: 'Something went wrong.' });
});

// Housekeeping: drop expired refresh tokens hourly.
setInterval(() => db.pruneExpiredTokens(), 60 * 60 * 1000).unref();

app.listen(PORT, () => {
  console.log(`GymRank API listening on http://localhost:${PORT}  (CORS: ${ORIGIN})`);
});
