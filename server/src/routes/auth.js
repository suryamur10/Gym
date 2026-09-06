import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, publicUser } from '../db.js';
import {
  ACCESS_TTL,
  issueRefreshToken,
  requireAuth,
  signAccessToken,
  verifyRefreshToken,
} from '../auth.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function handleFromName(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return `@${slug || 'lifter'}`;
}

function sessionPayload(user) {
  return {
    user: publicUser(user),
    accessToken: signAccessToken(user),
    refreshToken: issueRefreshToken(user),
    expiresIn: ACCESS_TTL,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body ?? {};

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'invalid_email', message: 'Enter a valid email address.' });
  }
  if (!password || String(password).length < 8) {
    return res
      .status(400)
      .json({ error: 'weak_password', message: 'Password must be at least 8 characters.' });
  }
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'invalid_name', message: 'Enter your name.' });
  }
  if (db.findUserByEmail(email)) {
    return res
      .status(409)
      .json({ error: 'email_taken', message: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = db.createUser({
    email,
    name: String(name).trim(),
    handle: handleFromName(String(name).trim()),
    passwordHash,
  });

  return res.status(201).json(sessionPayload(user));
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: 'missing_credentials', message: 'Email and password are required.' });
  }

  const user = db.findUserByEmail(email);
  const ok = user && (await bcrypt.compare(String(password), user.passwordHash));
  if (!ok) {
    return res
      .status(401)
      .json({ error: 'invalid_credentials', message: 'Incorrect email or password.' });
  }

  return res.json(sessionPayload(user));
});

// POST /api/auth/refresh  — validates + rotates the refresh token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) {
    return res.status(401).json({ error: 'missing_token', message: 'Refresh token required.' });
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ error: 'invalid_token', message: 'Refresh token is invalid.' });
  }

  const stored = db.findRefreshToken(payload.jti);
  if (!stored || stored.expiresAt < Date.now()) {
    return res
      .status(401)
      .json({ error: 'expired_session', message: 'Session expired. Please log in again.' });
  }

  const user = db.findUserById(payload.sub);
  if (!user) {
    db.revokeRefreshToken(payload.jti);
    return res.status(401).json({ error: 'no_user', message: 'Account no longer exists.' });
  }

  // Rotate: the presented refresh token is single-use.
  db.revokeRefreshToken(payload.jti);
  return res.json(sessionPayload(user));
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      db.revokeRefreshToken(payload.jti);
    } catch {
      /* already invalid — nothing to revoke */
    }
  }
  return res.status(204).end();
});

// GET /api/auth/me  — protected
router.get('/me', requireAuth, (req, res) => {
  const user = db.findUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'no_user', message: 'Account not found.' });
  return res.json({ user: publicUser(user) });
});

export default router;
