import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Search } from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../lib/format';

const nav: { label: string; to: string }[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Lifts', to: '#' },
  { label: 'Challenges', to: '#' },
  { label: 'Leaderboard', to: '#' },
  { label: 'Find a Friend', to: '/friends' },
];

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/friends?q=${encodeURIComponent(q)}` : '/friends');
    setSearch('');
  };

  const avatar = user ? initials(user.name) : '?';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo size="sm" />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {nav.map((item) => {
            const active = item.to !== '#' && location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-surface-2 text-text'
                    : 'text-muted hover:bg-surface-2/60 hover:text-text'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={handleSearch} className="relative ml-auto hidden w-56 lg:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a lifter…"
            aria-label="Find a lifter"
            className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm placeholder:text-muted-2 focus:border-accent"
          />
        </form>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface py-1 pl-3 pr-1">
            <span className="hidden font-display text-xs font-semibold text-muted sm:inline">
              {user?.handle}
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
