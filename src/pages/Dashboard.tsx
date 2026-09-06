import { Dumbbell, Flame, Swords, TrendingUp, Trophy } from 'lucide-react';
import TopBar from '../components/dashboard/TopBar';
import SectionHeading from '../components/SectionHeading';
import RankCard from '../components/dashboard/RankCard';
import StatCard from '../components/dashboard/StatCard';
import LiftRow from '../components/dashboard/LiftRow';
import VolumeChart from '../components/dashboard/VolumeChart';
import ChallengeCard from '../components/dashboard/ChallengeCard';
import ChallengeLifterRow from '../components/dashboard/ChallengeLifterRow';
import { useAuth } from '../context/AuthContext';
import { activeChallenges, challengeableLifters, weekLifts, weekSummary } from '../data/mock';
import { firstName, formatNumber } from '../lib/format';

export default function Dashboard() {
  const { user } = useAuth();
  const greetingName = user ? firstName(user.name) : 'lifter';

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
              {weekSummary.label} · {weekSummary.sessions} sessions logged
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-ghost">
              <Dumbbell size={16} aria-hidden="true" />
              Log a lift
            </button>
            <button type="button" className="btn-accent">
              <Swords size={16} aria-hidden="true" />
              Challenge a lifter
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RankCard />
          <StatCard
            label="Volume this week"
            value={formatNumber(weekSummary.volume)}
            unit="lb"
            icon={TrendingUp}
            delta={{ label: `+${weekSummary.volumeDeltaPct}%`, direction: 'up' }}
            hint="vs last week"
          />
          <StatCard
            label="New PRs"
            value={String(weekSummary.newPrs)}
            icon={Flame}
            hint={weekSummary.prLifts}
          />
          <StatCard
            label="Active challenges"
            value={String(weekSummary.activeChallenges)}
            icon={Swords}
            hint="2 you're leading"
          />
        </div>

        {/* Lifts + volume */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <SectionHeading>This week&apos;s lifts</SectionHeading>
            <div className="card px-4">
              <ul className="divide-y divide-border-soft">
                {weekLifts.map((lift) => (
                  <LiftRow key={lift.name} lift={lift} />
                ))}
              </ul>
            </div>
          </section>

          <section>
            <SectionHeading>Volume</SectionHeading>
            <VolumeChart />
          </section>
        </div>

        {/* Competitive */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <SectionHeading>Active challenges</SectionHeading>
            <div className="space-y-4">
              {activeChallenges.map((c) => (
                <ChallengeCard key={c.metric} c={c} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeading
              action={<Trophy size={16} className="text-muted-2" aria-hidden="true" />}
            >
              Challenge a lifter
            </SectionHeading>
            <div className="card px-4">
              <ul className="divide-y divide-border-soft">
                {challengeableLifters.map((lifter) => (
                  <ChallengeLifterRow key={lifter.handle} lifter={lifter} />
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
