import { leaderboard } from '../data/mock';
import { formatLb } from '../lib/format';

export default function LeaderboardCard() {
  return (
    <section
      className="card w-full max-w-sm p-5 backdrop-blur-sm"
      aria-label="Gold Division leaderboard, this week"
    >
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-muted">
          Gold Division · This week
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-win">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-win opacity-60 motion-safe:animate-pulse-dot" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-win" />
          </span>
          Live
        </span>
      </header>

      <ol className="space-y-1">
        {leaderboard.map((row, i) => (
          <li
            key={row.handle}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
              row.isYou ? 'bg-accent/10 ring-1 ring-inset ring-accent/30' : ''
            }`}
          >
            <span className="w-4 font-display text-lg font-bold text-muted-2">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {row.name}
                {row.isYou && <span className="ml-1.5 text-xs font-medium text-accent">· you</span>}
              </p>
              <p className="truncate text-xs text-muted">{row.handle}</p>
            </div>
            <span className="font-display text-lg font-bold tabular-nums">
              {formatLb(row.volume)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
