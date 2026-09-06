import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';

export const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
export const REFRESH_TTL_DAYS = Number(process.env.JWT_REFRESH_TTL_DAYS || 7);

const ISSUER = 'gymrank';

export function signAccessToken(user) {
  return jwt.sign(
    { email: user.email, name: user.name, handle: user.handle },
    ACCESS_SECRET,
    { subject: user.id, issuer: ISSUER, audience: 'gymrank-web', expiresIn: ACCESS_TTL },
  );
}

/** Refresh tokens carry a jti so they can be revoked and rotated server-side. */
export function issueRefreshToken(user) {
  const jti = randomUUID();
  const expiresInSec = REFRESH_TTL_DAYS * 24 * 60 * 60;
  const token = jwt.sign({}, REFRESH_SECRET, {
    subject: user.id,
    issuer: ISSUER,
    audience: 'gymrank-web',
    jwtid: jti,
    expiresIn: expiresInSec,
  });
  db.addRefreshToken({ jti, userId: user.id, expiresAt: Date.now() + expiresInSec * 1000 });
  return token;
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, { issuer: ISSUER, audience: 'gymrank-web' });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET, { issuer: ISSUER, audience: 'gymrank-web' });
}

/** Express middleware — requires a valid Bearer access token. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'missing_token', message: 'Authorization header required.' });
  }
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      error: expired ? 'token_expired' : 'invalid_token',
      message: expired ? 'Access token expired.' : 'Access token is invalid.',
    });
  }
}
