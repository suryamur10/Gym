# GymRank

A competitive strength-training web app where lifters log workouts, earn ranks,
and challenge each other head-to-head.

- **`/login`** — email + password sign-in (real JWT auth)
- **`/register`** — create an account
- **`/dashboard`** — protected: rank progress, weekly lifts, volume chart, challenges

## Stack

**Frontend** — React + Vite + TypeScript, Tailwind CSS, react-router-dom,
lucide-react, Barlow / Barlow Condensed.

**Backend** (`/server`) — Node + Express, `jsonwebtoken`, `bcryptjs`. Users are
persisted to a JSON file (`server/data/db.json`) — swap `server/src/db.js` for
Postgres/SQLite without touching the routes.

The lifting stats on the dashboard (lifts, volume, challenges) are still mocked in
`src/data/mock.ts`; only authentication and the signed-in user are real.

## Auth design

- **Access token** — short-lived (15 min), HS256, sent as `Authorization: Bearer`.
- **Refresh token** — 7 days, has a `jti` and is stored server-side so it can be
  revoked. Single-use: every `/refresh` rotates it.
- Client keeps both in `localStorage`. `src/lib/api.ts` attaches the access token,
  and on a `401` transparently calls `/refresh` once (single-flight) and retries.
  If the refresh fails, tokens are cleared and the app drops back to `/login`.
- `AuthProvider` (`src/context/AuthContext.tsx`) restores the session on load via
  `/auth/me`; `<RequireAuth>` guards the dashboard.

### Endpoints (`/api/auth`)

| Method | Path        | Body                          | Notes                          |
| ------ | ----------- | ----------------------------- | ------------------------------ |
| POST   | `/register` | `{ name, email, password }`   | password ≥ 8 chars             |
| POST   | `/login`    | `{ email, password }`         | → `{ user, accessToken, refreshToken }` |
| POST   | `/refresh`  | `{ refreshToken }`            | rotates the refresh token      |
| POST   | `/logout`   | `{ refreshToken }`            | revokes the refresh token      |
| GET    | `/me`       | —                             | `Bearer` access token required |

## Getting started

```bash
npm install            # also installs server deps (postinstall)
cp server/.env.example server/.env   # then change the JWT secrets

npm run dev            # runs API (:4000) + web (:5173) together
```

Open http://localhost:5173. In dev, Vite proxies `/api` → `http://localhost:4000`
(see `vite.config.ts`), so there's no CORS in the way.

**Demo account:** `marcus@gymrank.app` / `deadlift`

### Other scripts

```bash
npm run dev:web        # frontend only
npm run dev:api        # backend only
npm run build          # typecheck + production build
npm run preview        # serve the production build
```

For a production build, set `VITE_API_URL` to the deployed API origin
(e.g. `https://api.gymrank.example/api`) and run real secrets in `server/.env`.

## Structure

```
src/
  components/           shared UI (Logo, RankBadge, ProgressBar, DeltaChip…)
    dashboard/          dashboard-only pieces (TopBar, LiftRow, VolumeChart…)
  context/AuthContext.tsx   session state + login/register/logout
  lib/api.ts            token storage + auto-refreshing fetch client
  lib/format.ts         number / weight / name helpers
  data/mock.ts          mocked lifting stats
  pages/                Login, Register, Dashboard
  App.tsx               routes + guards
server/
  src/index.js          express app
  src/auth.js           token signing / verification + requireAuth middleware
  src/db.js             JSON-file user + refresh-token store
  src/routes/auth.js    register / login / refresh / logout / me
```
