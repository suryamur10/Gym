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
import { ah } from './async-handler.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function handleFromName(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return `@${slug || 'lifter'}`;
}

async function sessionPayload(user) {
  return {
    user: publicUser(user),
    accessToken: signAccessToken(user),
    refreshToken: await issueRefreshToken(user),
    expiresIn: ACCESS_TTL,
  };
}

// POST /api/auth/register
router.post(
  '/register',
  ah(async (req, res) => {
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
    if (await db.findUserByEmail(email)) {
      return res
        .status(409)
        .json({ error: 'email_taken', message: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await db.createUser({
      email,
      name: String(name).trim(),
      handle: handleFromName(String(name).trim()),
      passwordHash,
    });

    return res.status(201).json(await sessionPayload(user));
  }),
);

// POST /api/auth/login
router.post(
  '/login',
  ah(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'missing_credentials', message: 'Email and password are required.' });
    }

    const user = await db.findUserByEmail(email);
    const ok = user && (await bcrypt.compare(String(password), user.passwordHash));
    if (!ok) {
      return res
        .status(401)
        .json({ error: 'invalid_credentials', message: 'Incorrect email or password.' });
    }

    return res.json(await sessionPayload(user));
  }),
);

// POST /api/auth/refresh  — validates + rotates the refresh token
router.post(
  '/refresh',
  ah(async (req, res) => {
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

    const stored = await db.findRefreshToken(payload.jti);
    if (!stored || stored.expiresAt < Date.now()) {
      return res
        .status(401)
        .json({ error: 'expired_session', message: 'Session expired. Please log in again.' });
    }

    const user = await db.findUserById(payload.sub);
    if (!user) {
      await db.revokeRefreshToken(payload.jti);
      return res.status(401).json({ error: 'no_user', message: 'Account no longer exists.' });
    }

    // Rotate: the presented refresh token is single-use.
    await db.revokeRefreshToken(payload.jti);
    return res.json(await sessionPayload(user));
  }),
);

// POST /api/auth/logout
router.post(
  '/logout',
  ah(async (req, res) => {
    const { refreshToken } = req.body ?? {};
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await db.revokeRefreshToken(payload.jti);
      } catch {
        /* already invalid — nothing to revoke */
      }
    }
    return res.status(204).end();
  }),
);

// GET /api/auth/me  — protected
router.get(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const user = await db.findUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'no_user', message: 'Account not found.' });
    return res.json({ user: publicUser(user) });
  }),
);

const GENDERS = ['male', 'female', 'other', 'na'];
const GOALS = ['lose_weight', 'gain_muscle', 'build_strength'];
const between = (n, lo, hi) => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;

/** Validate + normalize a partial vitals/goal profile. Returns { profile } or { error }. */
function cleanProfile(input, existing) {
  const next = { ...(existing ?? {}) };
  if ('weightLb' in input) {
    if (input.weightLb !== null && !between(input.weightLb, 50, 1500)) {
      return { error: 'Enter a weight between 50 and 1500 lb.' };
    }
    next.weightLb = input.weightLb;
  }
  if ('heightIn' in input) {
    if (input.heightIn !== null && !between(input.heightIn, 24, 108)) {
      return { error: 'Enter a height between 24 and 108 inches.' };
    }
    next.heightIn = input.heightIn;
  }
  if ('age' in input) {
    if (input.age !== null && !between(input.age, 13, 120)) {
      return { error: 'Enter an age between 13 and 120.' };
    }
    next.age = input.age;
  }
  if ('gender' in input) {
    if (input.gender !== null && !GENDERS.includes(input.gender)) {
      return { error: 'Pick a valid gender option.' };
    }
    next.gender = input.gender;
  }
  if ('goal' in input) {
    if (input.goal !== null && !GOALS.includes(input.goal)) {
      return { error: 'Pick a valid goal.' };
    }
    next.goal = input.goal;
  }
  return { profile: next };
}

// PATCH /api/auth/me  — update vitals/goal and/or mark onboarding done
router.patch(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const user = await db.findUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'no_user', message: 'Account not found.' });

    const { profile, onboardingComplete } = req.body ?? {};
    const patch = {};

    if (profile !== undefined && profile !== null) {
      const result = cleanProfile(profile, user.profile);
      if (result.error) {
        return res.status(400).json({ error: 'invalid_profile', message: result.error });
      }
      patch.profile = result.profile;
    }
    if (onboardingComplete !== undefined) {
      patch.onboardingComplete = Boolean(onboardingComplete);
    }

    const updated = await db.updateUser(req.userId, patch);
    return res.json({ user: publicUser(updated) });
  }),
);

export default router;
