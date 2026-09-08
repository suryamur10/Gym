import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { ah } from './async-handler.js';

const router = Router();
router.use(requireAuth);

export const DEFAULT_METRIC = 'Weekly volume';

// POST /api/challenges  — call out a friend to a head-to-head
router.post(
  '/',
  ah(async (req, res) => {
    const { opponentId } = req.body ?? {};
    if (!opponentId || opponentId === req.userId) {
      return res.status(400).json({ error: 'invalid_opponent', message: 'Pick a lifter to challenge.' });
    }

    const opponent = await db.findUserById(opponentId);
    if (!opponent) {
      return res.status(404).json({ error: 'no_user', message: 'That lifter no longer exists.' });
    }

    const friendship = await db.findFriendshipBetween(req.userId, opponentId);
    if (!friendship || friendship.status !== 'accepted') {
      return res
        .status(403)
        .json({ error: 'not_friends', message: 'You can only challenge your friends.' });
    }

    if (await db.findChallengeBetween(req.userId, opponentId)) {
      return res.status(409).json({
        error: 'already_challenged',
        message: `You already have a challenge with ${opponent.name}.`,
      });
    }

    const challenge = await db.createChallenge({
      challengerId: req.userId,
      opponentId,
      metric: DEFAULT_METRIC,
    });
    return res.status(201).json({ challenge });
  }),
);

// DELETE /api/challenges/:id  — end a challenge (either participant)
router.delete(
  '/:id',
  ah(async (req, res) => {
    const removed = await db.deleteChallenge(req.params.id, req.userId);
    if (!removed) return res.status(404).json({ error: 'not_found', message: 'Challenge not found.' });
    return res.status(204).end();
  }),
);

export default router;
