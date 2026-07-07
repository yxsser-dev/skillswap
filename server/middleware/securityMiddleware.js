// Simple in-memory rate limiter to prevent API abuse (Going Beyond Class Scope)
const ipRequestCounts = {};

function rateLimiter(req, limit = 100, timeframeMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipRequestCounts[ip]) {
      ipRequestCounts[ip] = [];
    }

    // Filter out requests older than the timeframe
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

// Meaningful System Audit Logger
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

module.exports = { rateLimiter, auditLogger };