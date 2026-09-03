// ================================================================
// routes/authRoutes.js — Stage 9: Login Added
// ================================================================
// Handles all /api/auth/* routes:
//   POST /api/auth/register   (Stage 8)
//   POST /api/auth/login      (Stage 9) ← NEW
//   POST /api/auth/logout     (client-side — no server route needed)
// ================================================================

const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");

const { handleValidationErrors } = require("../middleware/validate");
const { authLimiter }            = require("../middleware/securityMiddleware"); // ← NEW
const { register, login }        = require("../controllers/authController");

// ─── Validation Rules for Registration ────────────────────────
const validRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(), // lowercase, remove dots in gmail, etc.

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// ─── Validation Rules for Login ───────────────────────────────
const validLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  // Note: no min length check on login — we don't want to hint
  // at what the password constraints are to potential attackers
];

// ─── Routes ───────────────────────────────────────────────────

// POST /api/auth/register
// authLimiter: max 10 registration attempts per IP per 15 min
router.post("/register", authLimiter, validRegister, handleValidationErrors, register);

// POST /api/auth/login
// authLimiter: max 10 login attempts per IP per 15 min (brute-force protection)
router.post("/login",    authLimiter, validLogin,    handleValidationErrors, login);

module.exports = router;
