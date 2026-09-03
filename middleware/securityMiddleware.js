// ================================================================
// middleware/securityMiddleware.js
// ================================================================
// What is this file?
//   Exports two rate limiters for protecting auth routes.
//   Rate limiting prevents brute-force attacks on login/register.
//
// Why here and not in server.js?
//   Keeps server.js clean. Security config is a separate concern.
// ================================================================

const rateLimit = require("express-rate-limit");

// ─────────────────────────────────────────────────────────────
//  Auth Rate Limiter
//  Applied to: POST /api/auth/login and POST /api/auth/register
//
//  Allows: 10 attempts per IP per 15 minutes.
//  Why?
//    Login brute force = attacker tries millions of passwords.
//    Without rate limiting: 1,000,000 tries per second possible.
//    With rate limiting: max 10 tries per 15 min = attack is useless.
//
//  Example of attack being stopped:
//    Attacker sends request 1-10 → allowed
//    Attacker sends request 11  → 429 Too Many Requests
//    Attacker must wait 15 minutes before trying again.
//    Even if they try another IP, we've slowed them massively.
// ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes in milliseconds
  max:              10,              // max 10 requests per window per IP
  message: {
    success: false,
    message: "Too many attempts from this IP. Please try again after 15 minutes.",
  },
  standardHeaders:  true,  // send RateLimit-* headers in response (informative)
  legacyHeaders:    false,  // don't send the old X-RateLimit-* headers
});

// ─────────────────────────────────────────────────────────────
//  General API Rate Limiter
//  Applied to: all routes globally in server.js
//
//  Allows: 100 requests per IP per 15 minutes.
//  Prevents API abuse and DDoS (Distributed Denial of Service).
//  A genuine user rarely needs more than 100 requests per 15 min.
// ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,             // 100 requests per IP
  message: {
    success: false,
    message: "Too many requests from this IP. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { authLimiter, apiLimiter };
