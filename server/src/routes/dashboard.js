import { Router } from 'express';
import { db, iso, weekLabel, weekStartOf } from '../db.js';
import { requireAuth } from '../auth.js';
import { ah } from './async-handler.js';
import { DAYS } from './lifts.js';

const router = Router();
router.use(requireAuth);

const RP_PER_VOLUME = 100; // 1 RP per 100 lb of lifetime volume
const RP_TO_NEXT_TIER = 2000;

const compact = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n);

const shortName = (name) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
};

/** Whole days remaining in the current (Mon–Sun) week. */
function daysLeftInWeek() {
  return 6 - ((new Date().getDay() + 6) % 7);
}

/**
 * Everything the dashboard renders, computed from one snapshot of the store.
 * A brand-new lifter gets base values: unranked, zeroed stats, no lifts.
 */
function buildDashboard(userId, state) {
  const usersById = new Map(state.users.map((u) => [u.id, u]));
  const myLifts = state.lifts
    .filter((l) => l.userId === userId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const thisWeekStart = iso(weekStartOf());
  const lastWeekStartDate = weekStartOf();
  lastWeekStartDate.setDate(lastWeekStartDate.getDate() - 7);
  const lastWeekStart = iso(lastWeekStartDate);

  const thisWeek = myLifts.filter((l) => l.weekStart === thisWeekStart);
  const lastWeek = myLifts.filter((l) => l.weekStart === lastWeekStart);

  const weekVolumeFor = (uid) =>
    state.lifts
      .filter((l) => l.userId === uid && l.weekStart === thisWeekStart)
      .reduce((sum, l) => sum + l.volume, 0);

  // Personal-best lookup per exercise, using only lifts logged before each one.
  const shapeLift = (lift) => {
    const key = lift.exercise.toLowerCase();
    const prior = myLifts.filter(
      (l) => l.exercise.toLowerCase() === key && l.createdAt < lift.createdAt,
    );
    const prevBest = prior.length ? Math.max(...prior.map((l) => l.weightLb)) : null;
    const delta = prevBest === null ? 0 : lift.weightLb - prevBest;
    return {
      id: lift.id,
      name: lift.exercise,
      weight: lift.weightLb,
      sets: lift.sets,
      reps: lift.reps,
      volume: lift.volume,
      day: lift.day,
      delta,
      isPr: prevBest !== null && lift.weightLb > prevBest,
      // purely visual: progress toward the next 45 lb plate
      progress: Math.round(((lift.weightLb % 45) / 45) * 100),
    };
  };

  const lifts = thisWeek
    .map(shapeLift)
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));

  const volume = lifts.reduce((sum, l) => sum + l.volume, 0);
  const lastWeekVolume = lastWeek.reduce((sum, l) => sum + l.volume, 0);
  const sessions = new Set(lifts.map((l) => l.day)).size;
  const prNames = [...new Set(lifts.filter((l) => l.isPr).map((l) => l.name))];

  const volumeByDay = DAYS.map((day) => ({
    day,
    volume: lifts.filter((l) => l.day === day).reduce((sum, l) => sum + l.volume, 0),
  }));

  const myFriendships = state.friendships.filter(
    (f) => f.requesterId === userId || f.addresseeId === userId,
  );
  const challengeBetween = (a, b) =>
    state.challenges.find(
      (c) =>
        (c.challengerId === a && c.opponentId === b) ||
        (c.challengerId === b && c.opponentId === a),
    ) ?? null;

  // Friends you can call out, plus whether a challenge is already running.
  const friends = myFriendships
    .filter((f) => f.status === 'accepted')
    .map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId))
    .map((id) => usersById.get(id))
    .filter(Boolean)
    .map((u) => ({
      id: u.id,
      name: u.name,
      handle: u.handle,
      challenged: Boolean(challengeBetween(userId, u.id)),
    }));

  // Head-to-heads: my weekly volume vs each opponent's, live.
  const activeChallenges = state.challenges
    .filter((c) => c.challengerId === userId || c.opponentId === userId)
    .map((c) => {
      const opponentId = c.challengerId === userId ? c.opponentId : c.challengerId;
      const opponent = usersById.get(opponentId);
      if (!opponent) return null;
      const rivalVolume = weekVolumeFor(opponentId);
      return {
        id: c.id,
        metric: c.metric,
        you: compact(volume),
        rivalName: shortName(opponent.name),
        rivalScore: compact(rivalVolume),
        daysLeft: daysLeftInWeek(),
        leading: volume >= rivalVolume,
      };
    })
    .filter(Boolean);

  const lifetimeVolume = myLifts.reduce((sum, l) => sum + l.volume, 0);
  const rp = Math.round(lifetimeVolume / RP_PER_VOLUME);
  const rank =
    myLifts.length === 0
      ? { placed: false, label: 'Unranked', hint: 'Log a lift to get placed' }
      : {
          placed: true,
          tier: 'bronze',
          label: 'Bronze I',
          nextTier: 'Bronze II',
          rp,
          rpToNext: Math.max(0, RP_TO_NEXT_TIER - rp),
          progressPct: Math.min(100, Math.round((rp / RP_TO_NEXT_TIER) * 100)),
        };

  return {
    rank,
    week: {
      label: weekLabel(),
      sessions,
      volume,
      volumeDeltaPct:
        lastWeekVolume > 0 ? Math.round(((volume - lastWeekVolume) / lastWeekVolume) * 100) : 0,
      newPrs: prNames.length,
      prLifts: prNames.length ? prNames.join(', ') : '—',
      activeChallenges: activeChallenges.length,
      challengesLeading: activeChallenges.filter((c) => c.leading).length,
    },
    lifts,
    volumeByDay,
    friends,
    activeChallenges,
  };
}

// GET /api/dashboard
router.get(
  '/',
  ah(async (req, res) => {
    const state = await db.snapshot();
    return res.json(buildDashboard(req.userId, state));
  }),
);

export default router;
