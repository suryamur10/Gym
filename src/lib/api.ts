/**
 * Thin API client for the GymRank auth server.
 *
 * - Access + refresh tokens are kept in localStorage.
 * - Every protected request attaches the access token; on a 401 it transparently
 *   refreshes once (single-flight) and retries.
 * - If the refresh fails, tokens are cleared and `onForcedLogout` listeners fire
 *   so the app can drop back to the login screen.
 */

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

const ACCESS_KEY = 'gr_access';
const REFRESH_KEY = 'gr_refresh';

export type Gender = 'male' | 'female' | 'other' | 'na';
export type Goal = 'lose_weight' | 'gain_muscle' | 'build_strength';

export interface Profile {
  weightLb?: number | null;
  heightIn?: number | null;
  age?: number | null;
  gender?: Gender | null;
  goal?: Goal | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  handle: string;
  createdAt: string;
  profile: Profile | null;
  onboardingComplete: boolean;
}

export interface MePatch {
  profile?: Profile | null;
  onboardingComplete?: boolean;
}

interface SessionResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// --- token storage -------------------------------------------------------------

const safeGet = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

export const getAccessToken = () => safeGet(ACCESS_KEY);
export const getRefreshToken = () => safeGet(REFRESH_KEY);

function setTokens(access: string, refresh: string) {
  try {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  } catch {
    /* storage unavailable — session lives for this tab only */
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

// --- forced-logout notification ----------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();

export function onForcedLogout(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyForcedLogout() {
  listeners.forEach((fn) => fn());
}

// --- core fetch --------------------------------------------------------------

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ApiError(res.status, body.error || 'error', body.message || 'Request failed.');
  }
  return body as T;
}

let refreshInFlight: Promise<boolean> | null = null;

function refreshTokens(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          clearTokens();
          notifyForcedLogout();
          return false;
        }
        const data = (await res.json()) as SessionResponse;
        setTokens(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const access = getAccessToken();
  if (access) headers.set('Authorization', `Bearer ${access}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry && getRefreshToken()) {
    const ok = await refreshTokens();
    if (ok) return request<T>(path, options, false);
  }

  return parse<T>(res);
}

// --- public API ------------------------------------------------------------

export const authApi = {
  async login(email: string, password: string): Promise<AuthUser> {
    const data = await request<SessionResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  async register(name: string, email: string, password: string): Promise<AuthUser> {
    const data = await request<SessionResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  async me(): Promise<AuthUser> {
    const data = await request<{ user: AuthUser }>('/auth/me');
    return data.user;
  },

  async updateMe(patch: MePatch): Promise<AuthUser> {
    const data = await request<{ user: AuthUser }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return data.user;
  },

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    clearTokens();
    if (!refreshToken) return;
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      /* best effort */
    }
  },
};

// --- friends ---------------------------------------------------------------

export type FriendStatus = 'none' | 'friends' | 'outgoing' | 'incoming';

export interface LifterResult extends AuthUser {
  friendStatus: FriendStatus;
}

export interface FriendUser extends AuthUser {
  friendshipId: string;
}

export interface FriendsSnapshot {
  friends: FriendUser[];
  incoming: FriendUser[];
  outgoing: FriendUser[];
}

export const usersApi = {
  async search(query: string): Promise<LifterResult[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const data = await request<{ results: LifterResult[] }>(
      `/users/search?q=${encodeURIComponent(q)}`,
    );
    return data.results;
  },

  async friends(): Promise<FriendsSnapshot> {
    return request<FriendsSnapshot>('/users/friends');
  },

  /** Send a friend request, or accept an incoming one. Returns the new status. */
  async addFriend(userId: string): Promise<FriendStatus> {
    const data = await request<{ user: LifterResult }>(`/users/${userId}/friend`, {
      method: 'POST',
    });
    return data.user.friendStatus;
  },

  /** Unfriend, cancel a sent request, or decline an incoming one. */
  async removeFriend(userId: string): Promise<FriendStatus> {
    const data = await request<{ friendStatus: FriendStatus }>(`/users/${userId}/friend`, {
      method: 'DELETE',
    });
    return data.friendStatus;
  },
};

// --- lifts & dashboard ------------------------------------------------------

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** The viewer's local weekday, Mon-indexed to match WEEKDAYS. */
export const todayWeekday = (): Weekday => WEEKDAYS[(new Date().getDay() + 6) % 7];

export interface NewLift {
  exercise: string;
  weightLb: number;
  sets: number;
  reps: number;
  day: Weekday;
}

export interface DashLift {
  id: string;
  name: string;
  weight: number;
  sets: number;
  reps: number;
  volume: number;
  day: Weekday;
  delta: number;
  isPr: boolean;
  progress: number;
}

export interface DashRank {
  placed: boolean;
  label: string;
  hint?: string;
  tier?: 'bronze';
  nextTier?: string;
  rp?: number;
  rpToNext?: number;
  progressPct?: number;
}

export interface HeadToHead {
  id: string;
  metric: string;
  you: string;
  rivalName: string;
  rivalScore: string;
  daysLeft: number;
  leading: boolean;
}

export interface ChallengeFriend {
  id: string;
  name: string;
  handle: string;
  challenged: boolean;
}

export interface DashboardView {
  rank: DashRank;
  week: {
    label: string;
    sessions: number;
    volume: number;
    volumeDeltaPct: number;
    newPrs: number;
    prLifts: string;
    activeChallenges: number;
    challengesLeading: number;
  };
  lifts: DashLift[];
  volumeByDay: { day: Weekday; volume: number }[];
  friends: ChallengeFriend[];
  activeChallenges: HeadToHead[];
}

export const liftsApi = {
  async add(lift: NewLift): Promise<void> {
    await request('/lifts', { method: 'POST', body: JSON.stringify(lift) });
  },

  async remove(id: string): Promise<void> {
    await request(`/lifts/${id}`, { method: 'DELETE' });
  },
};

export const dashboardApi = {
  async get(): Promise<DashboardView> {
    return request<DashboardView>('/dashboard');
  },
};

export const challengesApi = {
  /** Call out a friend to a weekly-volume head-to-head. */
  async create(opponentId: string): Promise<void> {
    await request('/challenges', { method: 'POST', body: JSON.stringify({ opponentId }) });
  },

  async end(id: string): Promise<void> {
    await request(`/challenges/${id}`, { method: 'DELETE' });
  },
};
