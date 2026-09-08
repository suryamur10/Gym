import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

/**
 * A tiny document store. The whole dataset lives under a single key.
 *
 * - In production (Vercel), it's stored in Upstash Redis — set either
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN or KV_REST_API_URL /
 *   KV_REST_API_TOKEN (both pairs are read).
 * - With no Redis credentials it falls back to a local JSON file, so
 *   `npm run dev` works with zero setup.
 *
 * Trade-off: reads and writes touch the whole document, and two concurrent
 * writers can clobber each other's change (last write wins). Fine for a demo;
 * move to per-record keys or a relational DB for real concurrency.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_FILE = join(DATA_DIR, 'db.json');
const REDIS_KEY = 'gymrank:state:v1';

const emptyState = () => ({
  users: [],
  refreshTokens: [],
  friendships: [],
  lifts: [],
  challenges: [],
});

// --- storage backend --------------------------------------------------------

let redisPromise;
function getRedis() {
  if (redisPromise !== undefined) return redisPromise;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    redisPromise = null;
    return null;
  }
  // Dynamic import so local (file-mode) dev never needs the package installed.
  redisPromise = import('@upstash/redis').then(({ Redis }) => new Redis({ url, token }));
  return redisPromise;
}

async function readState() {
  const redis = await getRedis();
  if (redis) {
    const stored = await redis.get(REDIS_KEY);
    return stored ? { ...emptyState(), ...stored } : emptyState();
  }
  if (!existsSync(DB_FILE)) return emptyState();
  try {
    return { ...emptyState(), ...JSON.parse(readFileSync(DB_FILE, 'utf8')) };
  } catch {
    return emptyState();
  }
}

async function writeState(state) {
  const redis = await getRedis();
  if (redis) {
    await redis.set(REDIS_KEY, state);
    return;
  }
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

// --- seeding ---------------------------------------------------------------

let seedPromise;
/** Create the demo account once, if the store is empty. Idempotent. */
export function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const state = await readState();
      if (state.users.length > 0) return;
      state.users.push({
        id: 'usr_marcus',
        email: 'marcus@gymrank.app',
        name: 'Marcus Malone',
        handle: '@marcusm',
        passwordHash: bcrypt.hashSync('deadlift', 10),
        createdAt: new Date().toISOString(),
        profile: null,
        onboardingComplete: true,
      });
      await writeState(state);
    })().catch((err) => {
      seedPromise = undefined; // allow a retry on the next request
      throw err;
    });
  }
  return seedPromise;
}

const normalizeEmail = (email) => String(email).trim().toLowerCase();
const rid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const notExpired = (t) => t.expiresAt > Date.now();

export const db = {
  /** The entire dataset — used by the dashboard to compute in one round trip. */
  async snapshot() {
    return readState();
  },

  async findUserByEmail(email) {
    const e = normalizeEmail(email);
    const s = await readState();
    return s.users.find((u) => u.email === e) ?? null;
  },

  async findUserById(id) {
    const s = await readState();
    return s.users.find((u) => u.id === id) ?? null;
  },

  async createUser({ email, name, handle, passwordHash }) {
    const s = await readState();
    const user = {
      id: rid('usr'),
      email: normalizeEmail(email),
      name,
      handle,
      passwordHash,
      createdAt: new Date().toISOString(),
      profile: null,
      onboardingComplete: false,
    };
    s.users.push(user);
    await writeState(s);
    return user;
  },

  async updateUser(id, patch) {
    const s = await readState();
    const user = s.users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, patch);
    await writeState(s);
    return user;
  },

  async addRefreshToken({ jti, userId, expiresAt }) {
    const s = await readState();
    s.refreshTokens = s.refreshTokens.filter(notExpired); // opportunistic prune
    s.refreshTokens.push({ jti, userId, expiresAt });
    await writeState(s);
  },

  async findRefreshToken(jti) {
    const s = await readState();
    const token = s.refreshTokens.find((t) => t.jti === jti) ?? null;
    return token && notExpired(token) ? token : null;
  },

  async revokeRefreshToken(jti) {
    const s = await readState();
    const before = s.refreshTokens.length;
    s.refreshTokens = s.refreshTokens.filter((t) => t.jti !== jti);
    if (s.refreshTokens.length !== before) await writeState(s);
  },

  async revokeAllUserTokens(userId) {
    const s = await readState();
    s.refreshTokens = s.refreshTokens.filter((t) => t.userId !== userId);
    await writeState(s);
  },

  // --- users & friendships -------------------------------------------------

  /** Substring match on name, handle, or email. Excludes `excludeId`. */
  async searchUsers(query, excludeId, limit = 20) {
    const q = String(query).trim().toLowerCase();
    if (!q) return [];
    const s = await readState();
    return s.users
      .filter((u) => u.id !== excludeId)
      .filter((u) =>
        [u.name, u.handle, u.email].some((field) => field.toLowerCase().includes(q)),
      )
      .slice(0, limit);
  },

  /** Every friendship row involving `userId` (any status). */
  async friendshipsForUser(userId) {
    const s = await readState();
    return s.friendships.filter(
      (f) => f.requesterId === userId || f.addresseeId === userId,
    );
  },

  async findFriendshipBetween(a, b) {
    const s = await readState();
    return (
      s.friendships.find(
        (f) =>
          (f.requesterId === a && f.addresseeId === b) ||
          (f.requesterId === b && f.addresseeId === a),
      ) ?? null
    );
  },

  async createFriendship({ requesterId, addresseeId }) {
    const s = await readState();
    const friendship = {
      id: rid('frn'),
      requesterId,
      addresseeId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    s.friendships.push(friendship);
    await writeState(s);
    return friendship;
  },

  async updateFriendship(id, patch) {
    const s = await readState();
    const friendship = s.friendships.find((f) => f.id === id);
    if (!friendship) return null;
    Object.assign(friendship, patch);
    await writeState(s);
    return friendship;
  },

  async deleteFriendship(id) {
    const s = await readState();
    const before = s.friendships.length;
    s.friendships = s.friendships.filter((f) => f.id !== id);
    if (s.friendships.length !== before) await writeState(s);
  },

  // --- lifts -------------------------------------------------------------

  /** All of a user's logged lifts, oldest first. */
  async liftsForUser(userId) {
    const s = await readState();
    return s.lifts
      .filter((l) => l.userId === userId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async createLift({ userId, exercise, weightLb, sets, reps, day }) {
    const s = await readState();
    const lift = {
      id: rid('lft'),
      userId,
      exercise,
      weightLb,
      sets,
      reps,
      day,
      volume: weightLb * sets * reps,
      weekStart: iso(weekStartOf()),
      createdAt: new Date().toISOString(),
    };
    s.lifts.push(lift);
    await writeState(s);
    return lift;
  },

  async deleteLift(id, userId) {
    const s = await readState();
    const before = s.lifts.length;
    s.lifts = s.lifts.filter((l) => !(l.id === id && l.userId === userId));
    const removed = s.lifts.length !== before;
    if (removed) await writeState(s);
    return removed;
  },

  // --- challenges (friend vs friend, head-to-head) ----------------------

  /** Every challenge `userId` is part of, on either side. */
  async challengesForUser(userId) {
    const s = await readState();
    return s.challenges.filter(
      (c) => c.challengerId === userId || c.opponentId === userId,
    );
  },

  async findChallengeBetween(a, b) {
    const s = await readState();
    return (
      s.challenges.find(
        (c) =>
          (c.challengerId === a && c.opponentId === b) ||
          (c.challengerId === b && c.opponentId === a),
      ) ?? null
    );
  },

  async createChallenge({ challengerId, opponentId, metric }) {
    const s = await readState();
    const challenge = {
      id: rid('chl'),
      challengerId,
      opponentId,
      metric,
      createdAt: new Date().toISOString(),
    };
    s.challenges.push(challenge);
    await writeState(s);
    return challenge;
  },

  /** Either participant may end a challenge. */
  async deleteChallenge(id, userId) {
    const s = await readState();
    const before = s.challenges.length;
    s.challenges = s.challenges.filter(
      (c) => !(c.id === id && (c.challengerId === userId || c.opponentId === userId)),
    );
    const removed = s.challenges.length !== before;
    if (removed) await writeState(s);
    return removed;
  },
};

// --- week helpers ---------------------------------------------------------

/** Local-time Monday (00:00) of the week containing `d`. */
export function weekStartOf(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const mondayOffset = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - mondayOffset);
  return x;
}

export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** e.g. "Week of Sep 8–14" */
export function weekLabel(weekStartDate = weekStartOf()) {
  const end = new Date(weekStartDate);
  end.setDate(end.getDate() + 6);
  const month = weekStartDate.toLocaleString('en-US', { month: 'short' });
  const endMonth = end.toLocaleString('en-US', { month: 'short' });
  const tail =
    month === endMonth
      ? `${weekStartDate.getDate()}–${end.getDate()}`
      : `${weekStartDate.getDate()} – ${endMonth} ${end.getDate()}`;
  return `Week of ${month} ${tail}`;
}

/**
 * The relationship `viewerId` has with the person on the other side of
 * `friendship`: 'none' | 'friends' | 'outgoing' (viewer asked) | 'incoming'.
 */
export const friendStatusFor = (viewerId, friendship) => {
  if (!friendship) return 'none';
  if (friendship.status === 'accepted') return 'friends';
  return friendship.requesterId === viewerId ? 'outgoing' : 'incoming';
};

/** Public shape of a user — never leak the password hash. */
export const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  handle: u.handle,
  createdAt: u.createdAt,
  profile: u.profile ?? null,
  onboardingComplete: u.onboardingComplete ?? false,
});
