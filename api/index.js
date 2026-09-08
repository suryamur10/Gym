// Vercel serverless entrypoint — the whole Express API runs as one function.
// See vercel.json: every /api/* request is rewritten here.
import app from '../server/src/app.js';

export default app;
