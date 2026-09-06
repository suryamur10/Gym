import { volumeByDay } from '../../data/mock';
import { formatNumber } from '../../lib/format';

const TRACK_PX = 128;

export default function VolumeChart() {
  const max = Math.max(...volumeByDay.map((d) => d.volume));

  return (
    <div className="card p-4">
      <h3 className="font-display text-lg font-bold uppercase tracking-tight">Volume by day</h3>
      <p className="mb-4 text-xs text-muted">Mon–Sun · lb moved</p>

      <div className="flex items-end gap-2 sm:gap-3" style={{ height: TRACK_PX }}>
        {volumeByDay.map((d) => {
          const h = max > 0 ? Math.round((d.volume / max) * TRACK_PX) : 0;
          const tallest = d.volume === max && d.volume > 0;
          return (
            <div key={d.day} className="flex flex-1 flex-col items-center justify-end">
              <div
                className={`w-full rounded-md transition-[height] duration-500 ease-out ${
                  tallest ? 'bg-accent' : d.volume > 0 ? 'bg-surface-3' : 'bg-surface-3/40'
                }`}
                style={{ height: Math.max(h, 4) }}
                title={`${d.day}: ${formatNumber(d.volume)} lb`}
                role="img"
                aria-label={`${d.day}: ${formatNumber(d.volume)} pounds`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-2 sm:gap-3">
        {volumeByDay.map((d) => {
          const tallest = d.volume === max && d.volume > 0;
          return (
            <span
              key={d.day}
              className={`flex-1 text-center text-xs font-semibold ${
                tallest ? 'text-text' : 'text-muted-2'
              }`}
            >
              {d.day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
