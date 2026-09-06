import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface DeltaChipProps {
  /** e.g. "+15 lb PR", "-5 lb", "+11%" */
  label: string;
  direction: 'up' | 'down';
  className?: string;
}

export default function DeltaChip({ label, direction, className = '' }: DeltaChipProps) {
  const up = direction === 'up';
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up ? 'bg-win/10 text-win' : 'bg-loss/10 text-loss'
      } ${className}`}
    >
      <Icon size={13} strokeWidth={2.75} aria-hidden="true" />
      {label}
    </span>
  );
}
