import type { ReactNode } from 'react';

interface SectionHeadingProps {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeading({ children, action, className = '' }: SectionHeadingProps) {
  return (
    <div className={`mb-3 flex items-end justify-between ${className}`}>
      <h2 className="font-display text-xl font-bold uppercase tracking-tight">{children}</h2>
      {action}
    </div>
  );
}
