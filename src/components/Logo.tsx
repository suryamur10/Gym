import { Dumbbell } from 'lucide-react';

interface LogoProps {
  /** icon + wordmark size */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { box: 'h-8 w-8 rounded-[10px]', icon: 16, word: 'text-lg' },
  md: { box: 'h-10 w-10 rounded-xl', icon: 20, word: 'text-2xl' },
  lg: { box: 'h-12 w-12 rounded-2xl', icon: 24, word: 'text-3xl' },
} as const;

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`grid place-items-center bg-accent text-white shadow-[0_6px_20px_-6px_rgba(255,90,31,0.6)] ${s.box}`}
      >
        <Dumbbell size={s.icon} strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className={`font-display font-extrabold uppercase tracking-tight ${s.word}`}>
        Gym<span className="text-accent">Rank</span>
      </span>
    </span>
  );
}
