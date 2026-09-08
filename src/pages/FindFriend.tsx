import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Clock, Search, UserPlus, Users, X } from 'lucide-react';
import TopBar from '../components/dashboard/TopBar';
import SectionHeading from '../components/SectionHeading';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  usersApi,
  type FriendStatus,
  type FriendUser,
  type LifterResult,
} from '../lib/api';
import { initials } from '../lib/format';

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-3 font-display text-sm font-bold">
      {initials(name)}
    </span>
  );
}

interface LifterRowProps {
  name: string;
  handle: string;
  status: FriendStatus;
  busy?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
}

function LifterRow({ name, handle, status, busy, onAdd, onRemove }: LifterRowProps) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="truncate text-xs text-muted">{handle}</p>
      </div>

      {status === 'friends' && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-win">
            <Check size={14} aria-hidden="true" />
            Friends
          </span>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="btn-ghost px-3 py-1.5 text-sm"
          >
            Remove
          </button>
        </div>
      )}

      {status === 'outgoing' && (
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="btn-ghost px-3 py-1.5 text-sm text-muted"
        >
          <Clock size={14} aria-hidden="true" />
          Requested
        </button>
      )}

      {status === 'incoming' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAdd}
            disabled={busy}
            className="btn-accent px-3 py-1.5 text-sm"
          >
            <Check size={14} aria-hidden="true" />
            Accept
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            aria-label={`Decline request from ${name}`}
            className="btn-ghost px-2.5 py-1.5 text-sm"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {status === 'none' && (
        <button
          type="button"
          onClick={onAdd}
          disabled={busy}
          className="btn-accent px-3 py-1.5 text-sm"
        >
          <UserPlus size={14} aria-hidden="true" />
          Add friend
        </button>
      )}
    </li>
  );
}

export default function FindFriend() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [results, setResults] = useState<LifterResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendUser[]>([]);

  const loadFriends = useCallback(async () => {
    try {
      const snap = await usersApi.friends();
      setFriends(snap.friends);
      setIncoming(snap.incoming);
    } catch {
      /* non-fatal — the list just stays as it was */
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Keep the field in sync when the query arrives from elsewhere (e.g. the
  // top-bar search box navigating to /friends?q=…).
  const urlQuery = params.get('q') ?? '';
  useEffect(() => {
    setQuery((prev) => (prev === urlQuery ? prev : urlQuery));
  }, [urlQuery]);

  // Debounced search whenever the query changes.
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const q = query.trim();
    setParams(q ? { q } : {}, { replace: true });
    window.clearTimeout(timer.current);

    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }

    setSearching(true);
    timer.current = window.setTimeout(async () => {
      try {
        setResults(await usersApi.search(q));
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Search failed. Try again.');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer.current);
  }, [query, setParams]);

  const statusById = useMemo(() => {
    const map = new Map<string, FriendStatus>();
    friends.forEach((f) => map.set(f.id, 'friends'));
    incoming.forEach((f) => map.set(f.id, 'incoming'));
    return map;
  }, [friends, incoming]);

  const act = useCallback(
    async (userId: string, fn: () => Promise<FriendStatus>) => {
      setBusyId(userId);
      try {
        const status = await fn();
        setResults((prev) =>
          prev.map((r) => (r.id === userId ? { ...r, friendStatus: status } : r)),
        );
        await loadFriends();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Something went wrong.');
      } finally {
        setBusyId(null);
      }
    },
    [loadFriends],
  );

  const add = (id: string) => act(id, () => usersApi.addFriend(id));
  const remove = (id: string) => act(id, () => usersApi.removeFriend(id));

  const trimmed = query.trim();

  return (
    <div className="page-enter min-h-screen bg-bg">
      <TopBar />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Find a friend</h1>
        <p className="mt-1 text-muted">
          Search lifters by name, handle, or email and send a friend request.
        </p>

        <div className="relative mt-6">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lifters…"
            aria-label="Search lifters"
            className="field"
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-loss">
            {error}
          </p>
        )}

        {/* Search results */}
        {trimmed.length >= 2 && (
          <section className="mt-8">
            <SectionHeading>{searching ? 'Searching…' : 'Results'}</SectionHeading>
            {!searching && results.length === 0 ? (
              <div className="card px-4 py-8 text-center text-sm text-muted">
                No lifters match “{trimmed}”.
              </div>
            ) : (
              <div className="card px-4">
                <ul className="divide-y divide-border-soft">
                  {results.map((r) => (
                    <LifterRow
                      key={r.id}
                      name={r.name}
                      handle={r.handle}
                      status={statusById.get(r.id) ?? r.friendStatus}
                      busy={busyId === r.id}
                      onAdd={() => add(r.id)}
                      onRemove={() => remove(r.id)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <section className="mt-10">
            <SectionHeading>Friend requests</SectionHeading>
            <div className="card px-4">
              <ul className="divide-y divide-border-soft">
                {incoming.map((f) => (
                  <LifterRow
                    key={f.id}
                    name={f.name}
                    handle={f.handle}
                    status="incoming"
                    busy={busyId === f.id}
                    onAdd={() => add(f.id)}
                    onRemove={() => remove(f.id)}
                  />
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Current friends */}
        <section className="mt-10">
          <SectionHeading
            action={<Users size={16} className="text-muted-2" aria-hidden="true" />}
          >
            Your friends {friends.length > 0 && `(${friends.length})`}
          </SectionHeading>
          {friends.length === 0 ? (
            <div className="card px-4 py-8 text-center text-sm text-muted">
              {user ? 'No friends yet — search above to add some.' : ''}
            </div>
          ) : (
            <div className="card px-4">
              <ul className="divide-y divide-border-soft">
                {friends.map((f) => (
                  <LifterRow
                    key={f.id}
                    name={f.name}
                    handle={f.handle}
                    status="friends"
                    busy={busyId === f.id}
                    onRemove={() => remove(f.id)}
                  />
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
