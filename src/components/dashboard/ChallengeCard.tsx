import { Swords } from 'lucide-react';
import type { HeadToHead } from '../../lib/api';

interface ChallengeCardProps {
  c: HeadToHead;
  onEnd?: () => void;
}

export default function ChallengeCard({ c, onEnd }: ChallengeCardProps) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
          <Swords size={14} aria-hidden="true" />
          {c.metric}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              c.leading ? 'bg-win/10 text-win' : 'bg-loss/10 text-loss'
            }`}
          >
            {c.leading ? 'You leading' : 'Trailing'}
          </span>
          {onEnd && (
            <button
              type="button"
              onClick={onEnd}
              className="text-xs font-semibold text-muted-2 hover:text-loss"
            >
              End
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl bg-surface-2 p-3 text-center ring-1 ring-inset ring-accent/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">You</p>
          <p className="font-display text-2xl font-extrabold tabular-nums">{c.you}</p>
        </div>
        <span className="font-display text-sm font-bold text-muted-2">VS</span>
        <div className="flex-1 rounded-xl bg-surface-2 p-3 text-center">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">
            {c.rivalName}
          </p>
          <p className="font-display text-2xl font-extrabold tabular-nums">{c.rivalScore}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        {c.daysLeft} days left · {c.leading ? 'hold the lead' : 'close the gap'}
      </p>
    </div>
  );
}
