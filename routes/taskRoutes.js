// ================================================================
// routes/taskRoutes.js — Stage 10: Protected Routes
// ================================================================
// All task routes now require a valid JWT token.
// The protect middleware runs BEFORE every route handler.
// If no token / bad token → 401. Controller never runs.
// ================================================================

const express    = require("express");
const router     = express.Router();
const { body, param } = require("express-validator");

const { protect }                 = require("../middleware/authMiddleware"); // ← NEW
const { handleValidationErrors }  = require("../middleware/validate");
const {
  getAllTasks,
  getTaskStats,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require("../controllers/taskController");

// ─── Reusable Validation Rule Sets ───────────────────────────
// We define rules as arrays so they can be reused across routes.
// Each rule is a chain of methods:
//   body("fieldName")    → validate a field from req.body
//   param("fieldName")   → validate a URL parameter
//   .notEmpty()          → must not be empty string
//   .isInt({ min: 1 })   → must be a positive integer
//   .isIn([...])         → must be one of these values
//   .optional()          → skip this rule if field not present
//   .trim()              → remove whitespace (sanitize)
//   .escape()            → convert < > " etc. to HTML entities (XSS protection)
//   .withMessage("...")  → custom error message

const validTaskId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Task ID must be a positive integer"),
];

const validCreateTask = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 255 })
    .withMessage("Title must be 255 characters or fewer"),

  body("description")
    .optional()                  // not required — skip if missing
    .trim(),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),

  body("due_date")
    .optional()
    .isDate()
    .withMessage("Due date must be a valid date (YYYY-MM-DD)"),
];

const validUpdateTask = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Task ID must be a positive integer"),

  // All fields optional for update — only validate if provided
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty if provided")
    .isLength({ max: 255 })
    .withMessage("Title must be 255 characters or fewer"),

  body("status")
    .optional()
    .isIn(["pending", "in_progress", "completed", "cancelled"])
    .withMessage("Status must be: pending, in_progress, completed, or cancelled"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be: low, medium, or high"),

  body("due_date")
    .optional()
    .isDate()
    .withMessage("Due date must be a valid date (YYYY-MM-DD)"),
];

const validUpdateStatus = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Task ID must be a positive integer"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "in_progress", "completed", "cancelled"])
    .withMessage("Status must be: pending, in_progress, completed, or cancelled"),
];

// ─── Route Definitions ───────────────────────────────────────
// Pattern:
//   router.METHOD(path, protect, [...validationRules], handleValidationErrors, controller)
//
// "protect" is now the FIRST middleware on every route.
// If no valid token → 401 returned, nothing else runs.
// Only after protect passes does validation and the controller run.

// GET /api/tasks/stats  ← MUST be before /:id
router.get("/stats",        protect, getTaskStats);

// GET /api/tasks
router.get("/",             protect, getAllTasks);

// GET /api/tasks/:id
router.get("/:id",          protect, validTaskId, handleValidationErrors, getTaskById);

// POST /api/tasks
router.post("/",            protect, validCreateTask, handleValidationErrors, createTask);

// PUT /api/tasks/:id
router.put("/:id",          protect, validUpdateTask, handleValidationErrors, updateTask);

// PATCH /api/tasks/:id/status
router.patch("/:id/status", protect, validUpdateStatus, handleValidationErrors, updateTaskStatus);

// DELETE /api/tasks/:id
router.delete("/:id",       protect, validTaskId, handleValidationErrors, deleteTask);

module.exports = router;
