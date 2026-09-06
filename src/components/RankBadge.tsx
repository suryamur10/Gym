import { Shield } from 'lucide-react';
import type { Tier } from '../data/mock';

const tierBg: Record<Tier, string> = {
  gold: 'bg-tier-gold',
  silver: 'bg-tier-silver',
  platinum: 'bg-tier-platinum',
};

interface RankBadgeProps {
  tier: Tier;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { box: 'h-9 w-9 rounded-[10px]', icon: 16, text: 'text-[11px]' },
  md: { box: 'h-14 w-14 rounded-xl', icon: 24, text: 'text-xs' },
  lg: { box: 'h-20 w-20 rounded-2xl', icon: 34, text: 'text-sm' },
} as const;

/** Metallic tier badge — the visual hero of the app. */
export default function RankBadge({ tier, label, size = 'md', className = '' }: RankBadgeProps) {
  const s = sizes[size];
  return (
    <span className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <span
        className={`grid place-items-center text-[#1a1205] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.25)_inset] ${tierBg[tier]} ${s.box}`}
      >
        <Shield size={s.icon} strokeWidth={2.25} fill="rgba(0,0,0,0.12)" aria-hidden="true" />
      </span>
      <span className={`font-display font-bold uppercase tracking-[0.14em] text-muted ${s.text}`}>
        {label}
      </span>
    </span>
  );
}
