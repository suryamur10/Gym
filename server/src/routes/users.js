import { Router } from 'express';
import { db, friendStatusFor, publicUser } from '../db.js';
import { requireAuth } from '../auth.js';
import { ah } from './async-handler.js';

const router = Router();

router.use(requireAuth);

/** publicUser + how the signed-in lifter is connected to them. */
async function withFriendStatus(viewerId, user) {
  const friendship = await db.findFriendshipBetween(viewerId, user.id);
  return { ...publicUser(user), friendStatus: friendStatusFor(viewerId, friendship) };
}

// GET /api/users/search?q=  — find lifters by name, handle, or email
router.get(
  '/search',
  ah(async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) {
      return res.json({ query: q, results: [] });
    }
    const matches = await db.searchUsers(q, req.userId);
    const results = await Promise.all(matches.map((u) => withFriendStatus(req.userId, u)));
    return res.json({ query: q, results });
  }),
);

// GET /api/users/friends  — accepted friends + pending requests either way
router.get(
  '/friends',
  ah(async (req, res) => {
    const rows = await db.friendshipsForUser(req.userId);
    const other = (f) => (f.requesterId === req.userId ? f.addresseeId : f.requesterId);
    const hydrate = async (f) => {
      const user = await db.findUserById(other(f));
      return user ? { ...publicUser(user), friendshipId: f.id } : null;
    };
    const pick = async (rs) => (await Promise.all(rs.map(hydrate))).filter(Boolean);

    const friends = await pick(rows.filter((f) => f.status === 'accepted'));
    const incoming = await pick(
      rows.filter((f) => f.status === 'pending' && f.addresseeId === req.userId),
    );
    const outgoing = await pick(
      rows.filter((f) => f.status === 'pending' && f.requesterId === req.userId),
    );

    return res.json({ friends, incoming, outgoing });
  }),
);

// POST /api/users/:id/friend  — send a request, or accept an incoming one
router.post(
  '/:id/friend',
  ah(async (req, res) => {
    const targetId = req.params.id;
    if (targetId === req.userId) {
      return res.status(400).json({ error: 'self_friend', message: "You can't friend yourself." });
    }
    const target = await db.findUserById(targetId);
    if (!target) {
      return res.status(404).json({ error: 'no_user', message: 'That lifter no longer exists.' });
    }

    let friendship = await db.findFriendshipBetween(req.userId, targetId);
    if (!friendship) {
      friendship = await db.createFriendship({ requesterId: req.userId, addresseeId: targetId });
    } else if (friendship.status === 'pending' && friendship.addresseeId === req.userId) {
      friendship = await db.updateFriendship(friendship.id, { status: 'accepted' });
    }
    // else: already pending (outgoing) or accepted — nothing to do, return as-is.

    return res.json({
      user: { ...publicUser(target), friendStatus: friendStatusFor(req.userId, friendship) },
    });
  }),
);

// DELETE /api/users/:id/friend  — unfriend, cancel a request, or decline one
router.delete(
  '/:id/friend',
  ah(async (req, res) => {
    const friendship = await db.findFriendshipBetween(req.userId, req.params.id);
    if (friendship) await db.deleteFriendship(friendship.id);
    return res.json({ userId: req.params.id, friendStatus: 'none' });
  }),
);

export default router;
