import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Flame, Loader2, Plus, Swords, TrendingUp, Trophy } from 'lucide-react';
import TopBar from '../components/dashboard/TopBar';
import SectionHeading from '../components/SectionHeading';
import RankCard from '../components/dashboard/RankCard';
import StatCard from '../components/dashboard/StatCard';
import LiftRow from '../components/dashboard/LiftRow';
import VolumeChart from '../components/dashboard/VolumeChart';
import ChallengeCard from '../components/dashboard/ChallengeCard';
import ChallengeFriendRow from '../components/dashboard/ChallengeFriendRow';
import AddLiftForm from '../components/dashboard/AddLiftForm';
import { useAuth } from '../context/AuthContext';
import { firstName, formatNumber } from '../lib/format';
import {
  challengesApi,
  dashboardApi,
  liftsApi,
  todayWeekday,
  type DashboardView,
  type NewLift,
} from '../lib/api';

export default function Dashboard() {
  const { user } = useAuth();
  const greetingName = user ? firstName(user.name) : 'lifter';

  const [data, setData] = useState<DashboardView | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [liftView, setLiftView] = useState<'today' | 'week'>('today');

  const load = useCallback(async () => {
    setData(await dashboardApi.get());
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const addLift = async (lift: NewLift) => {
    await liftsApi.add(lift);
    await load();
    setAdding(false);
  };

  const challengeFriend = async (id: string) => {
    setBusyId(id);
    try {
      await challengesApi.create(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const endChallenge = async (id: string) => {
    setBusyId(id);
    try {
      await challengesApi.end(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-bg">
        <TopBar />
        <div className="grid place-items-center py-32 text-muted">
          <Loader2 size={28} className="animate-spin" aria-hidden="true" />
        </div>
      </div>
    );
  }

  const { rank, week, lifts, volumeByDay, friends, activeChallenges } = data;
  const hasVolumeDelta = week.volumeDeltaPct !== 0;

  const todayLifts = lifts.filter((l) => l.day === todayWeekday());
  const shownLifts = liftView === 'today' ? todayLifts : lifts;

  return (
    <div className="page-enter min-h-screen bg-bg">
      <TopBar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">
              Let&apos;s move weight, {greetingName}.
            </h1>
            <p className="mt-1 text-muted">
              {week.label} · {week.sessions} {week.sessions === 1 ? 'session' : 'sessions'} logged
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setAdding(true)}
            >
              <Dumbbell size={16} aria-hidden="true" />
              Log a lift
            </button>
            <button
              type="button"
              className="btn-accent"
              onClick={() =>
                document
                  .getElementById('challenge-friends')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            >
              <Swords size={16} aria-hidden="true" />
              Challenge a friend
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RankCard rank={rank} />
          <StatCard
            label="Volume this week"
            value={formatNumber(week.volume)}
            unit="lb"
            icon={TrendingUp}
            delta={
              hasVolumeDelta
                ? {
                    label: `${week.volumeDeltaPct > 0 ? '+' : ''}${week.volumeDeltaPct}%`,
                    direction: week.volumeDeltaPct >= 0 ? 'up' : 'down',
                  }
                : undefined
            }
            hint={hasVolumeDelta ? 'vs last week' : 'log lifts to build volume'}
          />
          <StatCard
            label="New PRs"
            value={String(week.newPrs)}
            icon={Flame}
            hint={week.prLifts}
          />
          <StatCard
            label="Active challenges"
            value={String(week.activeChallenges)}
            icon={Swords}
            hint={
              week.activeChallenges === 0
                ? 'none yet'
                : `${week.challengesLeading} you're leading`
            }
          />
        </div>

        {/* Lifts + volume */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <SectionHeading
              action={
                <div className="flex items-center gap-3">
                  <div
                    className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5 text-xs font-semibold"
                    role="tablist"
                    aria-label="Lift range"
                  >
                    {(['today', 'week'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={liftView === v}
                        onClick={() => setLiftView(v)}
                        className={`rounded-md px-2.5 py-1 transition-colors ${
                          liftView === v
                            ? 'bg-surface-3 text-text'
                            : 'text-muted hover:text-text'
                        }`}
                      >
                        {v === 'today' ? 'Today' : 'Week'}
                        <span className="ml-1.5 text-muted-2">
                          {v === 'today' ? todayLifts.length : lifts.length}
                        </span>
                      </button>
                    ))}
                  </div>
                  {!adding && (
                    <button
                      type="button"
                      onClick={() => setAdding(true)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-hover"
                    >
                      <Plus size={15} aria-hidden="true" />
                      Add lift
                    </button>
                  )}
                </div>
              }
            >
              {liftView === 'today' ? "Today's lifts" : "This week's lifts"}
            </SectionHeading>
            <div className="card px-4">
              {adding && (
                <AddLiftForm onAdd={addLift} onCancel={() => setAdding(false)} />
              )}
              {shownLifts.length === 0 && !adding ? (
                <p className="py-10 text-center text-sm text-muted">
                  {liftView === 'today'
                    ? lifts.length > 0
                      ? 'Nothing logged today yet.'
                      : 'No lifts logged today — add your first to get placed.'
                    : 'No lifts logged this week yet.'}
                </p>
              ) : (
                <ul className="divide-y divide-border-soft">
                  {shownLifts.map((lift) => (
                    <LiftRow key={lift.id} lift={lift} />
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <SectionHeading>Volume</SectionHeading>
            <VolumeChart data={volumeByDay} />
          </section>
        </div>

        {/* Competitive */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <SectionHeading>Active challenges</SectionHeading>
            {activeChallenges.length === 0 ? (
              <div className="card px-4 py-10 text-center text-sm text-muted">
                No active challenges yet — call out a friend to start one.
              </div>
            ) : (
              <div className="space-y-4">
                {activeChallenges.map((c) => (
                  <ChallengeCard key={c.id} c={c} onEnd={() => endChallenge(c.id)} />
                ))}
              </div>
            )}
          </section>

          <section id="challenge-friends" className="scroll-mt-20">
            <SectionHeading
              action={<Trophy size={16} className="text-muted-2" aria-hidden="true" />}
            >
              Challenge a friend
            </SectionHeading>
            <div className="card px-4">
              {friends.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">
                  You can only challenge friends.{' '}
                  <Link to="/friends" className="font-semibold text-accent hover:text-accent-hover">
                    Find a friend
                  </Link>{' '}
                  to get started.
                </p>
              ) : (
                <ul className="divide-y divide-border-soft">
                  {friends.map((f) => (
                    <ChallengeFriendRow
                      key={f.id}
                      name={f.name}
                      handle={f.handle}
                      challenged={f.challenged}
                      busy={busyId === f.id}
                      onChallenge={() => challengeFriend(f.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
