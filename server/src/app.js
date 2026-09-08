import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { ensureSeeded } from './db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import liftRoutes from './routes/lifts.js';
import challengeRoutes from './routes/challenges.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

// CORS_ORIGIN can be a comma-separated list. On Vercel the API and web app share
// an origin, so this only matters when they're hosted separately.
const ORIGIN = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: ORIGIN ? ORIGIN.split(',').map((o) => o.trim()) : true,
    credentials: true,
  }),
);
app.use(express.json());

// Make sure the demo account exists (runs its work once per instance).
// Non-fatal: if the store isn't reachable yet the request still proceeds.
app.use((_req, _res, next) => {
  ensureSeeded().then(
    () => next(),
    (err) => {
      console.error('seed skipped:', err.message);
      next();
    },
  );
});

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'gymrank-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lifts', liftRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 + error handlers
app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'server_error', message: 'Something went wrong.' });
});

export default app;
