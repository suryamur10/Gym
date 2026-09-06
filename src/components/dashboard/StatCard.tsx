import type { LucideIcon } from 'lucide-react';
import DeltaChip from '../DeltaChip';

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  delta?: { label: string; direction: 'up' | 'down' };
  hint?: string;
}

export default function StatCard({ label, value, unit, icon: Icon, delta, hint }: StatCardProps) {
  return (
    <div className="card flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
        <Icon size={16} className="text-muted-2" aria-hidden="true" />
      </div>

      <div className="mt-auto flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-extrabold tabular-nums leading-none">
          {value}
        </span>
        {unit && <span className="text-sm font-semibold text-muted">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {delta && <DeltaChip label={delta.label} direction={delta.direction} />}
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
    </div>
  );
}
