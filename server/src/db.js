import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_FILE = join(DATA_DIR, 'db.json');

/**
 * A tiny JSON-file-backed store. Persistent, zero native dependencies, and easy
 * to inspect. Swap for Postgres/SQLite without touching the route handlers.
 */
const empty = { users: [], refreshTokens: [] };

function load() {
  if (!existsSync(DB_FILE)) return structuredClone(empty);
  try {
    return { ...structuredClone(empty), ...JSON.parse(readFileSync(DB_FILE, 'utf8')) };
  } catch {
    return structuredClone(empty);
  }
}

let state = load();

function persist() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

function seed() {
  if (state.users.length > 0) return;
  state.users.push({
    id: 'usr_marcus',
    email: 'marcus@gymrank.app',
    name: 'Marcus Malone',
    handle: '@marcusm',
    passwordHash: bcrypt.hashSync('deadlift', 10),
    createdAt: new Date().toISOString(),
  });
  persist();
}
seed();

const normalizeEmail = (email) => String(email).trim().toLowerCase();

export const db = {
  findUserByEmail(email) {
    const e = normalizeEmail(email);
    return state.users.find((u) => u.email === e) ?? null;
  },

  findUserById(id) {
    return state.users.find((u) => u.id === id) ?? null;
  },

  createUser({ email, name, handle, passwordHash }) {
    const user = {
      id: `usr_${Math.random().toString(36).slice(2, 10)}`,
      email: normalizeEmail(email),
      name,
      handle,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    state.users.push(user);
    persist();
    return user;
  },

  addRefreshToken({ jti, userId, expiresAt }) {
    state.refreshTokens.push({ jti, userId, expiresAt });
    persist();
  },

  findRefreshToken(jti) {
    return state.refreshTokens.find((t) => t.jti === jti) ?? null;
  },

  revokeRefreshToken(jti) {
    state.refreshTokens = state.refreshTokens.filter((t) => t.jti !== jti);
    persist();
  },

  revokeAllUserTokens(userId) {
    state.refreshTokens = state.refreshTokens.filter((t) => t.userId !== userId);
    persist();
  },

  pruneExpiredTokens() {
    const now = Date.now();
    const before = state.refreshTokens.length;
    state.refreshTokens = state.refreshTokens.filter((t) => t.expiresAt > now);
    if (state.refreshTokens.length !== before) persist();
  },
};

/** Public shape of a user — never leak the password hash. */
export const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  handle: u.handle,
  createdAt: u.createdAt,
});
