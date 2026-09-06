interface ProgressBarProps {
  /** 0–100 */
  value: number;
  className?: string;
  tone?: 'accent' | 'metal';
  label?: string;
}

export default function ProgressBar({
  value,
  className = '',
  tone = 'accent',
  label,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-surface-3 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${
          tone === 'metal' ? 'bg-tier-gold' : 'bg-accent'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
