import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search } from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { currentUser } from '../../data/mock';
import { initials } from '../../lib/format';

const nav = ['Dashboard', 'Lifts', 'Challenges', 'Leaderboard'];

export default function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const avatar = user ? initials(user.name) : currentUser.initials;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo size="sm" />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {nav.map((item) => {
            const active = item === 'Dashboard';
            return (
              <a
                key={item}
                href="#"
                aria-current={active ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-surface-2 text-text'
                    : 'text-muted hover:bg-surface-2/60 hover:text-text'
                }`}
              >
                {item}
              </a>
            );
          })}
        </nav>

        <div className="relative ml-auto hidden w-56 lg:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Find a lifter…"
            aria-label="Find a lifter"
            className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm placeholder:text-muted-2 focus:border-accent"
          />
        </div>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface py-1 pl-1 pr-3">
            <span className="rounded-lg bg-tier-gold px-2 py-1 font-display text-xs font-bold uppercase tracking-wider text-[#1a1205]">
              {currentUser.tierLabel}
            </span>
            <span
              className="grid h-7 w-7 place-items-center rounded-full bg-surface-3 font-display text-xs font-bold"
              title={user?.name}
            >
              {avatar}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn-ghost px-3 py-2 text-sm"
          >
            <LogOut size={15} aria-hidden="true" />
            <span className="hidden sm:inline">{loggingOut ? 'Logging out…' : 'Log out'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
