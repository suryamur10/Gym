import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { ah } from './async-handler.js';

const router = Router();
router.use(requireAuth);

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const int = (v) => (typeof v === 'number' ? Math.trunc(v) : NaN);

// POST /api/lifts  — log a lift for the current week
router.post(
  '/',
  ah(async (req, res) => {
  const { exercise, weightLb, sets, reps, day } = req.body ?? {};

  const name = String(exercise ?? '').trim();
  if (name.length < 2 || name.length > 40) {
    return res.status(400).json({ error: 'invalid_exercise', message: 'Name the exercise (2–40 characters).' });
  }
  const w = Number(weightLb);
  if (!Number.isFinite(w) || w <= 0 || w > 2000) {
    return res.status(400).json({ error: 'invalid_weight', message: 'Enter a weight between 1 and 2000 lb.' });
  }
  const s = int(Number(sets));
  const r = int(Number(reps));
  if (!(s >= 1 && s <= 20)) {
    return res.status(400).json({ error: 'invalid_sets', message: 'Sets must be between 1 and 20.' });
  }
  if (!(r >= 1 && r <= 100)) {
    return res.status(400).json({ error: 'invalid_reps', message: 'Reps must be between 1 and 100.' });
  }
  if (!DAYS.includes(day)) {
    return res.status(400).json({ error: 'invalid_day', message: 'Pick a day of the week.' });
  }

  const lift = await db.createLift({
    userId: req.userId,
    exercise: name,
    weightLb: w,
    sets: s,
    reps: r,
    day,
  });
  return res.status(201).json({ lift });
  }),
);

// DELETE /api/lifts/:id
router.delete(
  '/:id',
  ah(async (req, res) => {
    const removed = await db.deleteLift(req.params.id, req.userId);
    if (!removed) return res.status(404).json({ error: 'not_found', message: 'Lift not found.' });
    return res.status(204).end();
  }),
);

export default router;
