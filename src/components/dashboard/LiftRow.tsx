import ProgressBar from '../ProgressBar';
import DeltaChip from '../DeltaChip';
import type { Lift } from '../../data/mock';
import { formatDelta } from '../../lib/format';

export default function LiftRow({ lift }: { lift: Lift }) {
  const up = lift.delta >= 0;
  const deltaLabel = `${formatDelta(lift.delta)}${lift.isPr ? ' PR' : ''}`;

  return (
    <li className="flex items-center gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate font-semibold">{lift.name}</p>
          <p className="shrink-0 font-display text-xl font-extrabold tabular-nums">
            {lift.weight}
            <span className="ml-1 text-xs font-semibold text-muted">lb</span>
          </p>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <ProgressBar value={lift.progress} className="flex-1" label={`${lift.name} progress`} />
          <DeltaChip label={deltaLabel} direction={up ? 'up' : 'down'} />
          <span className="w-8 shrink-0 text-right text-xs text-muted-2">{lift.day}</span>
        </div>
      </div>
    </li>
  );
}
