function rateLimiter(limit = 100, timeframeMs = 15 * 60 * 1000) {
  const ipRequestCounts = {};

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipRequestCounts[ip]) {
      ipRequestCounts[ip] = [];
    }

    ipRequestCounts[ip] = ipRequestCounts[ip].filter(timestamp => now - timestamp < timeframeMs);

    if (ipRequestCounts[ip].length >= limit) {
      console.warn(`[SECURITY WARN] Rate limit exceeded by IP: ${ip} on path: ${req.path}`);
      return res.status(429).json({
        error: 'Too many requests from this IP address. Please try again later.'
      });
    }

    ipRequestCounts[ip].push(now);
    next();
  };
}

// Stricter limiter specifically for auth routes (brute-force protection)
const isProd = process.env.NODE_ENV === 'production';

const GLOBAL_LIMIT = isProd ? 100 : 2000;         // requests per window
const AUTH_LIMIT = isProd ? 10 : 100;            // requests per window
const WINDOW_MS = 15 * 60 * 1000;               // 15 minutes

const authLimiter = rateLimiter(AUTH_LIMIT, WINDOW_MS);

function auditLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userIdentifier = req.user ? `User(ID: ${req.user.id}, Role: ${req.user.role})` : 'Guest(Unauthenticated)';
    console.log(
      `[AUDIT LOG] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Active: ${userIdentifier} | Duration: ${duration}ms`
    );
  });
  next();
}

module.exports = { rateLimiter, authLimiter, auditLogger, GLOBAL_LIMIT, WINDOW_MS };