/**
 * Wrap an async route handler so a rejected promise is forwarded to Express's
 * error middleware instead of becoming an unhandled rejection (Express 4 does
 * not do this itself).
 */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
