export const formatLb = (n: number): string => `${n.toLocaleString('en-US')} lb`;

export const formatNumber = (n: number): string => n.toLocaleString('en-US');

export const formatDelta = (n: number): string => `${n > 0 ? '+' : ''}${n} lb`;

export const firstName = (fullName: string): string => fullName.trim().split(/\s+/)[0] || fullName;

export const initials = (fullName: string): string =>
  fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
