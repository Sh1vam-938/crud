// ================================================================
// controllers/authController.js — Stage 9: Login + JWT
// ================================================================
// What is this file?
//   Handles all authentication logic:
//     Stage 8: register (create account + hash password)
//     Stage 9: login (verify password + issue JWT token)
//     Stage 9: logout (client-side — explained in notes)
//
// Why a separate auth controller?
//   Auth is a completely different concern from tasks.
//   Keeping it separate makes the codebase organized.
//   "Open a task controller" = find task logic.
//   "Open auth controller"   = find login/register logic.
// ================================================================

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");  // for creating and signing tokens
const pool   = require("../config/db");

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/register
//  Controller: register
//
//  Flow:
//    1. Read name, email, password from req.body
//       (validation already ran in the route — data is clean)
//    2. Check if email already exists in the DB
//    3. Hash the password with bcrypt
//    4. INSERT the new user into the database
//    5. Fetch the new user row (without password_hash)
//    6. Return the new user + 201 Created
// ─────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ── Step 1: Check if email is already registered ──────────
    // We cannot have two users with the same email.
    // The DB has a UNIQUE constraint on email, but we check here
    // first to give a friendly error message instead of a raw
    // MySQL constraint error.
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()] // normalize to lowercase for consistency
    );

    if (existingUsers.length > 0) {
      // 409 Conflict — the resource (email) already exists
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // ── Step 2: Hash the password ─────────────────────────────
    // NEVER store plain passwords in the database!
    // bcrypt.hash() takes:
    //   plainPassword: the raw password from req.body
    //   saltRounds: 12 — how many times to process the hash
    //               Higher = more secure but slower
    //               10-12 is the industry standard for web apps
    //
    // What is a "salt"?
    //   A random string added to the password BEFORE hashing.
    //   This ensures two users with the same password get
    //   DIFFERENT hashes.
    //   Without salt:  hash("password123") = "abc123" (always)
    //   With salt:     hash("password123" + randomSalt) = unique each time
    //
    // bcrypt.hash() is async — it takes time (intentionally slow
    // to make brute-force attacks impractical).
    const SALT_ROUNDS  = 12;
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Step 3: Insert the new user ───────────────────────────
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [
        name.trim(),
        email.toLowerCase().trim(), // always store email in lowercase
        password_hash,
      ]
    );

    // ── Step 4: Fetch the new user to return in response ──────
    // IMPORTANT: We SELECT only the columns we want to return.
    // We NEVER return password_hash to the client — ever!
    const [newUserRows] = await pool.query(
      "SELECT id, name, email, is_active, created_at FROM users WHERE id = ?",
      [result.insertId]
    );

    // 201 Created — successful registration
    res.status(201).json({
      success: true,
      message: "Account created successfully! You can now log in.",
      user: newUserRows[0],
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/login
//  Controller: login
//
//  Flow:
//    1. Find the user by email in the database
//    2. Compare the entered password against the stored hash
//    3. If matched → generate a JWT token with user info inside
//    4. Return the token to the client
//
//  After this, the client stores the token and sends it with
//  every future request in the Authorization header:
//    Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Step 1: Find user by email ────────────────────────────
    // We need password_hash here (only time we SELECT it)
    const [users] = await pool.query(
      "SELECT id, name, email, password_hash, is_active FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    // If email not found → generic error (don't say "email not found"
    // specifically — that would tell attackers which emails are registered)
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    // ── Step 2: Check if account is active ───────────────────
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "This account has been deactivated",
      });
    }

    // ── Step 3: Compare entered password with stored hash ─────
    // bcrypt.compare() hashes the entered password with the SAME
    // salt that's embedded in the stored hash, then compares.
    // Returns: true (match) or false (no match)
    // This is async because it runs the same slow algorithm as bcrypt.hash()
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",  // same message as wrong email!
      });
    }

    // ── Step 4: Generate a JWT token ──────────────────────────
    // jwt.sign(payload, secret, options)
    //
    // payload: data to EMBED in the token (readable by anyone)
    //   → include id and email so we know WHO the token belongs to
    //   → NEVER include password or sensitive data in payload!
    //
    // secret: a long random string from .env (JWT_SECRET)
    //   → used to SIGN the token (creates the signature part)
    //   → anyone with the secret can verify OR create tokens
    //   → keep it SECRET — never commit to git!
    //
    // options: { expiresIn } sets how long the token is valid
    //   → "7d" = 7 days, "1h" = 1 hour, "30m" = 30 minutes
    //   → After expiry, the token is invalid (user must log in again)
    const token = jwt.sign(
      {
        id:    user.id,
        email: user.email,
        name:  user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // ── Step 5: Return token + safe user info ─────────────────
    // NEVER return password_hash in the response!
    res.json({
      success: true,
      message: "Login successful",
      token,           // ← the client must save this and send it with future requests
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        is_active:  user.is_active,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  LOGOUT — Why there's no logout controller
// ─────────────────────────────────────────────────────────────
// JWT authentication is STATELESS — the server stores NO sessions.
// Every token is self-contained (user info + expiry embedded).
//
// Because the server has no session list, it CANNOT "invalidate"
// a specific token. The only way a token becomes invalid is:
//   a) It expires (after JWT_EXPIRES_IN time)
//   b) The JWT_SECRET changes (all tokens become invalid)
//
// Logout is handled CLIENT-SIDE:
//   The client (browser/app) simply DELETES the stored token.
//   On the next request, there's no token → server returns 401.
//   The user must log in again to get a new token.
//
// This is simpler and more scalable than session-based auth.
// (No shared session storage needed across multiple servers.)
//
// If you need TRUE server-side invalidation (e.g., for security-
// critical apps), you'd maintain a "token blacklist" in Redis/DB.
// We keep it simple — client-side logout is the standard approach.
// ─────────────────────────────────────────────────────────────

module.exports = { register, login };
