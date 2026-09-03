// ================================================================
// middleware/authMiddleware.js
// ================================================================
// What is this file?
//   A middleware function called "protect".
//   It runs BEFORE any protected route handler.
//   It does ONE job: verify the JWT token in the request.
//
// Where does the token come from?
//   The client sends it in the Authorization header:
//     Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
//
// What happens if the token is valid?
//   jwt.verify() decodes the token → gives us the payload.
//   We attach it to req.user = { id, email, name }
//   Then call next() → the route controller runs.
//
// What happens if the token is missing or invalid?
//   We return 401 Unauthorized immediately.
//   The controller NEVER runs.
//   This protects the route from unauthenticated access.
//
// Why middleware and not inside each controller?
//   DRY principle! Instead of copy-pasting token verification
//   in every controller, we do it once here and "plug it in"
//   to whichever routes need protection.
// ================================================================

const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    // ── Step 1: Read the Authorization header ─────────────────
    // req.headers.authorization = "Bearer eyJhbGciOiJIUzI1..."
    // If the header is missing, it's undefined.
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided. Please log in.",
      });
    }

    // ── Step 2: Extract the token ─────────────────────────────
    // "Bearer eyJhbGciOiJIUzI1..."
    //  split(" ") → ["Bearer", "eyJhbGci..."]
    //  [1]        → "eyJhbGci..."  (just the token part)
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token is malformed.",
      });
    }

    // ── Step 3: Verify the token ──────────────────────────────
    // jwt.verify(token, secret) does THREE things:
    //   1. Decodes the header and payload from Base64
    //   2. Recalculates the signature using JWT_SECRET
    //   3. Compares calculated signature with token's signature
    //
    // If they match → token is genuine → returns decoded payload
    // If they don't → throws JsonWebTokenError
    // If token expired → throws TokenExpiredError
    //
    // Note: protect is NOT async because jwt.verify() is synchronous.
    // It does math, not I/O — no await needed.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded = { id: 3, email: "charlie@test.com", name: "Charlie",
    //             iat: 1705312800, exp: 1705917600 }

    // ── Step 4: Attach user to the request ────────────────────
    // Controllers can now access req.user to know who is logged in.
    // Example: req.user.id → the logged-in user's database ID
    req.user = {
      id:    decoded.id,
      email: decoded.email,
      name:  decoded.name,
    };

    // ── Step 5: Pass to the next middleware / controller ───────
    next();
  } catch (error) {
    // Handle specific JWT errors with helpful messages
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    // Any other unexpected error
    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

module.exports = { protect };
