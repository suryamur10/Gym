import type { Rival } from '../../data/mock';
import { formatLb } from '../../lib/format';

const tierBg: Record<Rival['tier'], string> = {
  gold: 'bg-tier-gold',
  silver: 'bg-tier-silver',
  platinum: 'bg-tier-platinum',
};

export default function ChallengeLifterRow({ lifter }: { lifter: Rival }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-3 font-display text-xs font-bold">
        {lifter.name
          .split(' ')
          .map((p) => p[0])
          .join('')}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{lifter.name}</p>
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-[#1a1205] ${tierBg[lifter.tier]}`}
          >
            {lifter.tierLabel}
          </span>
          <span className="text-xs text-muted">{formatLb(lifter.volume)}</span>
        </div>
      </div>

      <button type="button" className="btn-accent px-3 py-1.5 text-sm">
        Challenge
      </button>
    </li>
  );
}
