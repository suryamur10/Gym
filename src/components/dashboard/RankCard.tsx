import { Shield } from 'lucide-react';
import RankBadge from '../RankBadge';
import ProgressBar from '../ProgressBar';
import { formatNumber } from '../../lib/format';
import type { DashRank } from '../../lib/api';

export default function RankCard({ rank }: { rank: DashRank }) {
  return (
    <div className="card relative overflow-hidden p-4 sm:col-span-2 lg:col-span-1">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-tier-gold opacity-[0.12] blur-2xl" />

      <div className="relative flex items-start gap-4">
        {rank.placed && rank.tier ? (
          <RankBadge tier={rank.tier} label="" size="md" />
        ) : (
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-3 text-muted-2">
            <Shield size={24} strokeWidth={2.25} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Rank</span>
          <p className="font-display text-3xl font-extrabold leading-tight">{rank.label}</p>
          <p className="text-sm text-muted">
            {rank.placed ? `${formatNumber(rank.rp ?? 0)} RP` : rank.hint}
          </p>
        </div>
      </div>

      {rank.placed && (
        <div className="relative mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
            <span className="text-muted">Toward {rank.nextTier}</span>
            <span className="text-text">{rank.progressPct}%</span>
          </div>
          <ProgressBar
            value={rank.progressPct ?? 0}
            tone="metal"
            label={`${rank.progressPct}% toward ${rank.nextTier}`}
          />
          <p className="mt-1.5 text-xs text-muted">
            {formatNumber(rank.rp ?? 0)} RP / {formatNumber(rank.rpToNext ?? 0)} to go
          </p>
        </div>
      )}
    </div>
  );
}
