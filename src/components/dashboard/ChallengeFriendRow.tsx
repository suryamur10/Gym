import { Check, Swords } from 'lucide-react';
import { initials } from '../../lib/format';

interface ChallengeFriendRowProps {
  name: string;
  handle: string;
  challenged: boolean;
  busy?: boolean;
  onChallenge: () => void;
}

export default function ChallengeFriendRow({
  name,
  handle,
  challenged,
  busy,
  onChallenge,
}: ChallengeFriendRowProps) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-3 font-display text-xs font-bold">
        {initials(name)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="truncate text-xs text-muted">{handle}</p>
      </div>

      {challenged ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-win">
          <Check size={14} aria-hidden="true" />
          In play
        </span>
      ) : (
        <button
          type="button"
          onClick={onChallenge}
          disabled={busy}
          className="btn-accent px-3 py-1.5 text-sm"
        >
          <Swords size={14} aria-hidden="true" />
          Challenge
        </button>
      )}
    </li>
  );
}
