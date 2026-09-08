import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Dumbbell, Loader2, TrendingDown, Trophy } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { ApiError, type Gender, type Goal } from '../lib/api';

const inputCls =
  'w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-text placeholder:text-muted-2 transition-colors focus:border-accent';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'na', label: 'Prefer not to say' },
];

const GOALS: { value: Goal; label: string; blurb: string; icon: typeof Dumbbell }[] = [
  { value: 'lose_weight', label: 'Lose weight', blurb: 'Lean out while keeping strength', icon: TrendingDown },
  { value: 'gain_muscle', label: 'Gain muscle', blurb: 'Add size with progressive volume', icon: Dumbbell },
  { value: 'build_strength', label: 'Build strength', blurb: 'Chase heavier numbers on the big lifts', icon: Trophy },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, status, updateMe } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [weight, setWeight] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');

  if (status === 'authenticated' && user?.onboardingComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  const finish = () => navigate('/dashboard', { replace: true });

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  };

  const skip = () => run(async () => {
    await updateMe({ onboardingComplete: true });
    finish();
  });

  const submitVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(weight);
    const totalIn = Number(heightFt) * 12 + Number(heightIn || 0);
    const a = Number(age);

    if (!(w >= 50 && w <= 1500)) return setError('Enter a weight between 50 and 1500 lb.');
    if (!(totalIn >= 24 && totalIn <= 108)) return setError('Enter a valid height.');
    if (!(a >= 13 && a <= 120)) return setError('Enter an age between 13 and 120.');
    if (!gender) return setError('Pick a gender option.');

    run(async () => {
      await updateMe({
        profile: { weightLb: w, heightIn: totalIn, age: a, gender: gender as Gender },
      });
      setError(null);
      setBusy(false);
      setStep(2);
    });
  };

  const pickGoal = (goal: Goal) =>
    run(async () => {
      await updateMe({ profile: { goal }, onboardingComplete: true });
      finish();
    });

  return (
    <div className="page-enter grid min-h-screen place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-lg">
        <Logo size="md" />

        <div className="mt-8 flex items-center gap-2" aria-hidden="true">
          <span className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-accent' : 'bg-surface-3'}`} />
          <span className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-surface-3'}`} />
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-2">
          Step {step} of 2
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-loss/30 bg-loss/10 px-3 py-2.5 text-sm text-loss">
            {error}
          </p>
        )}

        {step === 1 ? (
          <form onSubmit={submitVitals} noValidate className="mt-4">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Your vitals</h1>
            <p className="mt-1.5 text-muted">
              We use these to set your targets and ranks. You can change them later.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Weight</span>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className={`${inputCls} pr-10`}
                    placeholder="185"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                    lb
                  </span>
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Age</span>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={`${inputCls} pr-12`}
                    placeholder="29"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                    yrs
                  </span>
                </div>
              </label>

              <div className="col-span-2">
                <span className="mb-1.5 block text-sm font-semibold">Height</span>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      className={`${inputCls} pr-9`}
                      placeholder="5"
                      aria-label="Height, feet"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                      ft
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                      className={`${inputCls} pr-9`}
                      placeholder="10"
                      aria-label="Height, inches"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                      in
                    </span>
                  </div>
                </div>
              </div>

              <label className="col-span-2 block">
                <span className="mb-1.5 block text-sm font-semibold">Gender</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className={inputCls}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-7 flex items-center justify-between">
              <button type="button" onClick={skip} disabled={busy} className="btn-ghost">
                Skip for now
              </button>
              <button type="submit" disabled={busy} className="btn-accent">
                {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                Continue
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">What's your goal?</h1>
            <p className="mt-1.5 text-muted">Pick one — we'll shape your dashboard around it.</p>

            <div className="mt-6 space-y-3">
              {GOALS.map(({ value, label, blurb, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => pickGoal(value)}
                  disabled={busy}
                  className="card flex w-full items-center gap-4 p-4 text-left transition-colors hover:border-accent disabled:opacity-50"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold">{label}</span>
                    <span className="block text-sm text-muted">{blurb}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-7 flex items-center justify-between">
              <button type="button" onClick={() => setStep(1)} disabled={busy} className="btn-ghost">
                Back
              </button>
              <button type="button" onClick={skip} disabled={busy} className="btn-ghost">
                {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
