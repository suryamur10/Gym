export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LeaderboardEntry {
  name: string;
  handle: string;
  volume: number;
  isYou?: boolean;
}

export interface Lift {
  name: string;
  weight: number;
  delta: number;
  isPr: boolean;
  day: string;
  /** progress toward the next milestone, 0–100 */
  progress: number;
  sets?: number;
  reps?: number;
}

export interface VolumeDay {
  day: string;
  volume: number;
}

export interface HeadToHead {
  metric: string;
  you: string;
  rivalName: string;
  rivalScore: string;
  daysLeft: number;
  leading: boolean;
}

export interface Rival {
  name: string;
  handle: string;
  tier: Tier;
  tierLabel: string;
  volume: number;
}

/** The signed-in lifter. */
export const currentUser = {
  firstName: 'Marcus',
  fullName: 'Marcus Malone',
  handle: '@marcusm',
  initials: 'MM',
  tier: 'gold' as Tier,
  tierLabel: 'GOLD II',
  rankLabel: 'Gold II',
  rankPosition: 2,
  rankPool: 148,
  rp: 1840,
  rpToNext: 640,
  nextTier: 'Platinum IV',
  progressPct: 68,
};

export const leaderboard: LeaderboardEntry[] = [
  { name: 'Derek Kwan', handle: '@dkwanlifts', volume: 51_400 },
  { name: 'Marcus Malone', handle: '@marcusm', volume: 42_180, isYou: true },
  { name: 'Dana Reyes', handle: '@dlift_dana', volume: 39_760 },
];

export const weekSummary = {
  label: 'Week of Sept 1–7',
  sessions: 4,
  volume: 42_180,
  volumeDeltaPct: 11,
  newPrs: 2,
  prLifts: 'Squat, DL',
  activeChallenges: 3,
};

export const weekLifts: Lift[] = [
  { name: 'Back Squat', weight: 405, delta: 15, isPr: true, day: 'Tue', progress: 82 },
  { name: 'Bench Press', weight: 275, delta: 5, isPr: false, day: 'Wed', progress: 61 },
  { name: 'Deadlift', weight: 495, delta: 20, isPr: true, day: 'Thu', progress: 90 },
  { name: 'Overhead Press', weight: 165, delta: -5, isPr: false, day: 'Sat', progress: 44 },
];

export const volumeByDay: VolumeDay[] = [
  { day: 'Mon', volume: 6_100 },
  { day: 'Tue', volume: 9_400 },
  { day: 'Wed', volume: 7_200 },
  { day: 'Thu', volume: 11_300 },
  { day: 'Fri', volume: 0 },
  { day: 'Sat', volume: 8_180 },
  { day: 'Sun', volume: 0 },
];

export const activeChallenges: HeadToHead[] = [
  {
    metric: 'Heaviest Deadlift',
    you: '495',
    rivalName: 'Dana R.',
    rivalScore: '480',
    daysLeft: 3,
    leading: true,
  },
  {
    metric: 'Weekly Volume',
    you: '42.1k',
    rivalName: 'Derek K.',
    rivalScore: '51.4k',
    daysLeft: 6,
    leading: false,
  },
];

export const challengeableLifters: Rival[] = [
  { name: 'Dana Reyes', handle: '@dlift_dana', tier: 'gold', tierLabel: 'GOLD III', volume: 39_760 },
  { name: 'Jordan Tapia', handle: '@jtapia', tier: 'platinum', tierLabel: 'PLATINUM I', volume: 47_900 },
  { name: 'Sam Lin', handle: '@samlin', tier: 'silver', tierLabel: 'SILVER II', volume: 28_300 },
];
