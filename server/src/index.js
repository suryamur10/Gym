import app from './app.js';

// Local dev entrypoint. On Vercel the app is served from /api/index.js instead.
const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`GymRank API listening on http://localhost:${PORT}`);
});
