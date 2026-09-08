import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ApiError, WEEKDAYS, todayWeekday, type NewLift, type Weekday } from '../../lib/api';

const COMMON_LIFTS = [
  'Back Squat',
  'Front Squat',
  'Bench Press',
  'Overhead Press',
  'Deadlift',
  'Romanian Deadlift',
  'Barbell Row',
  'Pull-up',
];

const inputCls =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-muted-2 transition-colors focus:border-accent';

interface AddLiftFormProps {
  onAdd: (lift: NewLift) => Promise<void>;
  onCancel: () => void;
}

export default function AddLiftForm({ onAdd, onCancel }: AddLiftFormProps) {
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('5');
  const [day, setDay] = useState<Weekday>(todayWeekday);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const payload: NewLift = {
      exercise: exercise.trim(),
      weightLb: Number(weight),
      sets: Number(sets),
      reps: Number(reps),
      day,
    };
    if (payload.exercise.length < 2) return setError('Name the exercise.');
    if (!(payload.weightLb > 0)) return setError('Enter a weight.');
    if (!(payload.sets >= 1) || !(payload.reps >= 1)) return setError('Enter sets and reps.');

    setBusy(true);
    try {
      await onAdd(payload);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the lift.');
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="border-b border-border-soft py-4"
      aria-label="Add this week's lift"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.6fr_repeat(3,0.7fr)_1fr]">
        <label className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-xs font-semibold text-muted">Exercise</span>
          <input
            list="common-lifts"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            className={inputCls}
            placeholder="Back Squat"
            autoFocus
          />
          <datalist id="common-lifts">
            {COMMON_LIFTS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-muted">Weight</span>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={inputCls}
            placeholder="lb"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-muted">Sets</span>
          <input
            type="number"
            inputMode="numeric"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className={inputCls}
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-muted">Reps</span>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-xs font-semibold text-muted">Day</span>
          <select value={day} onChange={(e) => setDay(e.target.value as Weekday)} className={inputCls}>
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-2 text-xs text-loss">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <button type="submit" disabled={busy} className="btn-accent px-3 py-1.5 text-sm">
          {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          Add lift
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="btn-ghost px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
