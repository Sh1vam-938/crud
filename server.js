// ================================================================
// server.js — Stage 11: Security Hardening
// ================================================================
require("dotenv").config();
require("./config/db");

const express    = require("express");
const helmet     = require("helmet");
const cors       = require("cors");
const app        = express();
const PORT       = process.env.PORT || 3000;

// ─── Security Middleware ─────────────────────────────────────────
// ORDER MATTERS: security headers should be set FIRST, before
// any routes or other middleware.

// 1. Helmet — sets secure HTTP response headers
//    Protects against common vulnerabilities:
//      X-Content-Type-Options: nosniff        → prevents MIME sniffing
//      X-Frame-Options: SAMEORIGIN           → prevents clickjacking
//      Strict-Transport-Security             → enforces HTTPS
//      Content-Security-Policy               → restricts resource loading
//      Cross-Origin-Opener-Policy            → prevents tab-napping
//    One line of code fixes 11+ security headers automatically.
app.use(helmet());

// 2. CORS — Cross-Origin Resource Sharing
//    By default, browsers BLOCK requests from different origins.
//    Example: your React app at localhost:5173 calling API at localhost:3000
//    → Browser blocks it as a security measure.
//    cors() tells the browser: "it's okay, I allow this origin."
//
//    Current config: allow all origins (fine for development/learning).
//    Production config is shown below (commented out).
const corsOptions = {
  origin:      process.env.CORS_ORIGIN || "*",  // "*" = allow all origins
  methods:     ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Production CORS example (restrict to your frontend only):
// app.use(cors({ origin: "https://myapp.com" }));

// 3. Rate Limiter — global API limit (100 req / 15 min per IP)
//    More specific authLimiter (10 req) is applied in authRoutes.js
const { apiLimiter } = require("./middleware/securityMiddleware");
app.use("/api", apiLimiter);  // applies to ALL /api/* routes

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────
const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/api/tasks", taskRoutes);
app.use("/api/auth",  authRoutes);

// Root info
app.get("/", (req, res) => {
  res.json({
    message:  "✅ Task Manager API",
    version:  "8.0.0",
    stage:    "Stage 11 — Security Hardening",
    security: ["helmet", "cors", "rate-limiting", "jwt", "bcrypt"],
    endpoints: {
      auth:  "/api/auth  (register, login)",
      tasks: "/api/tasks (protected — requires JWT)",
    },
  });
});

// ─── Error Middleware — MUST be LAST ─────────────────────────
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running — Stage 11: Security Hardened`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n   Security: helmet ✅  cors ✅  rate-limit ✅  jwt ✅  bcrypt ✅\n`);
  console.log(`   POST   /api/auth/register  (limit: 10/15min)`);
  console.log(`   POST   /api/auth/login     (limit: 10/15min)`);
  console.log(`   GET    /api/tasks          (JWT required)`);
  console.log(`   POST   /api/tasks          (JWT required)`);
  console.log(`   ...and all other task routes\n`);
});
