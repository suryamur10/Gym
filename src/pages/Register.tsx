import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import Logo from '../components/Logo';
import LeaderboardCard from '../components/LeaderboardCard';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const { register, status, user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={user?.onboardingComplete ? '/dashboard' : '/onboarding'} replace />;
  }

  const passwordTooShort = password.length > 0 && password.length < 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not reach the server. Try again.',
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-border-soft bg-[#0B0D11] px-10 py-12 lg:flex lg:flex-col xl:px-16">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-[120px]" />

        <Logo size="md" />

        <div className="relative mt-auto max-w-lg">
          <h1 className="font-display text-5xl font-extrabold leading-[1.03] tracking-tight xl:text-6xl">
            Claim your <span className="text-accent">rank.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Create an account, log your first session, and get placed in a division.
          </p>

          <div className="mt-10">
            <LeaderboardCard />
          </div>
        </div>

        <p className="relative mt-auto pt-12 text-sm text-muted-2">
          © 2026 GymRank · Train loud.
        </p>
      </aside>

      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12 sm:px-10 lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <h2 className="font-display text-3xl font-extrabold tracking-tight">Create your account</h2>
          <p className="mt-1.5 text-muted">Free forever. No card, just barbells.</p>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2 rounded-xl border border-loss/30 bg-loss/10 px-3 py-2.5 text-sm text-loss"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
                Name
              </label>
              <div className="relative">
                <User
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Marcus Malone"
                  className="field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

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
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="field pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby="password-hint"
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
              <p
                id="password-hint"
                className={`mt-1.5 text-xs ${passwordTooShort ? 'text-loss' : 'text-muted-2'}`}
              >
                {passwordTooShort ? 'A bit longer — 8 characters minimum.' : 'Minimum 8 characters.'}
              </p>
            </div>

            <button type="submit" className="btn-accent w-full" disabled={submitting}>
              {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent hover:text-accent-hover">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
