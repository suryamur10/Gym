import RankBadge from '../RankBadge';
import ProgressBar from '../ProgressBar';
import { currentUser } from '../../data/mock';
import { formatNumber } from '../../lib/format';

export default function RankCard() {
  const u = currentUser;
  return (
    <div className="card relative overflow-hidden p-4 sm:col-span-2 lg:col-span-1">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-tier-gold opacity-[0.12] blur-2xl" />

      <div className="relative flex items-start gap-4">
        <RankBadge tier={u.tier} label="" size="md" />
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Rank</span>
          <p className="font-display text-3xl font-extrabold leading-tight">{u.rankLabel}</p>
          <p className="text-sm text-muted">
            Rank {u.rankPosition} of {u.rankPool}
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="text-muted">Toward {u.nextTier}</span>
          <span className="text-text">{u.progressPct}%</span>
        </div>
        <ProgressBar value={u.progressPct} tone="metal" label={`${u.progressPct}% toward ${u.nextTier}`} />
        <p className="mt-1.5 text-xs text-muted">
          {formatNumber(u.rp)} RP / {u.rpToNext} to go
        </p>
      </div>
    </div>
  );
}
