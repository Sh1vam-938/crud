// ================================================================
// middleware/errorMiddleware.js
// ================================================================
// What is this file?
//   A single, centralized place that catches ALL errors in the app.
//   Instead of writing res.status(500).json({ error: ... })
//   inside every controller, we call next(error) and this
//   middleware handles it uniformly.
//
// How does it work?
//   Express has a special 4-argument middleware signature:
//     (err, req, res, next)
//   When Express sees 4 arguments, it treats it as an ERROR handler.
//   It only runs when next(error) is called somewhere.
//
// Why centralize errors?
//   ✅ ONE consistent error response format across the whole app
//   ✅ Hides internal details (stack traces) from clients in production
//   ✅ Easier to add logging / alerting in one place
//   ✅ Controllers become cleaner (just throw or call next(err))
// ================================================================

// ─────────────────────────────────────────────────────────────
//  404 Handler — for unknown routes
//  This is NOT an error handler — it's a regular middleware.
//  It runs when no route matched the request.
//  Place this AFTER all routes in server.js.
// ─────────────────────────────────────────────────────────────
const notFound = (req, res, next) => {
  // Create an error object and pass it to the next error handler
  const error = new Error(`Route '${req.method} ${req.url}' not found`);
  error.statusCode = 404;
  next(error); // pass to errorHandler below
};

// ─────────────────────────────────────────────────────────────
//  Global Error Handler
//  Express identifies this as an error handler because it has
//  exactly 4 parameters: (err, req, res, next)
//  Must be registered LAST in server.js (after all routes).
// ─────────────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  // Use the error's statusCode if set, otherwise default to 500
  const statusCode = err.statusCode || 500;

  // In development: show the full error stack (useful for debugging)
  // In production: hide it (don't expose internals to clients)
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",

    // Only include stack trace in development mode
    ...(isDevelopment && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
