import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Apple, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import Logo from '../components/Logo';
import LeaderboardCard from '../components/LeaderboardCard';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1S8.7 5.9 12 5.9c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 2.9 14.7 2 12 2 6.9 2 2.8 6.1 2.8 12S6.9 22 12 22c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.9H12z"
      />
    </svg>
  );
}

interface LocationState {
  from?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status } = useAuth();

  const from = (location.state as LocationState | null)?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') return <Navigate to={from} replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not reach the server. Try again.',
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* LEFT — hype panel */}
      <aside className="relative hidden overflow-hidden border-r border-border-soft bg-[#0B0D11] px-10 py-12 lg:flex lg:flex-col xl:px-16">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-[120px]" />

        <Logo size="md" />

        <div className="relative mt-auto max-w-lg">
          <h1 className="font-display text-5xl font-extrabold leading-[1.03] tracking-tight xl:text-6xl">
            Every rep gets a <span className="text-accent">rank.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Log your lifts, climb the tiers, and call out rivals head-to-head.
          </p>

          <div className="mt-10">
            <LeaderboardCard />
          </div>
        </div>

        <p className="relative mt-auto pt-12 text-sm text-muted-2">
          © 2026 GymRank · Train loud.
        </p>
      </aside>

      {/* RIGHT — form */}
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12 sm:px-10 lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <h2 className="font-display text-3xl font-extrabold tracking-tight">Log in to GymRank</h2>
          <p className="mt-1.5 text-muted">Welcome back. Your division is waiting.</p>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2 rounded-xl border border-loss/30 bg-loss/10 px-3 py-2.5 text-sm text-loss"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleLogin} noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@email.com"
                  className="field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="field pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-text"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-border bg-surface-2 text-accent accent-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                />
                Keep me logged in
              </label>
              <a href="#" className="text-sm font-semibold text-accent hover:text-accent-hover">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="btn-accent w-full" disabled={submitting}>
              {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {submitting ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <p className="mt-3 text-xs text-muted-2">
            Demo account: <span className="text-muted">marcus@gymrank.app</span> /{' '}
            <span className="text-muted">deadlift</span>
          </p>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted-2">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn-ghost" disabled>
              <GoogleGlyph />
              Google
            </button>
            <button type="button" className="btn-ghost" disabled>
              <Apple size={16} aria-hidden="true" />
              Apple
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-muted">
            New to GymRank?{' '}
            <Link to="/register" className="font-semibold text-accent hover:text-accent-hover">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
