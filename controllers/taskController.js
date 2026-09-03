// ================================================================
// controllers/taskController.js — Stage 10: Auth-Scoped Queries
// ================================================================
// Changes from Stage 7:
//   - ALL queries now scope to req.user.id (the logged-in user)
//   - Hardcoded user_id = 1 is GONE
//   - Users can only see/edit/delete THEIR OWN tasks
//   - req.user is set by the protect middleware (authMiddleware.js)
// ================================================================

const pool = require("../config/db");

// ─────────────────────────────────────────────────────────────
//  GET /api/tasks
// ─────────────────────────────────────────────────────────────
const getAllTasks = async (req, res, next) => {
  try {
    const { status, priority } = req.query;

    // Every query is scoped to req.user.id.
    // Users ONLY see their own tasks — never another user's.
    let sql    = "SELECT * FROM tasks WHERE user_id = ?";
    let params = [req.user.id];

    if (status && priority) {
      sql += " AND status = ? AND priority = ?";
      params.push(status, priority);
    } else if (status) {
      sql += " AND status = ?";
      params.push(status);
    } else if (priority) {
      sql += " AND priority = ?";
      params.push(priority);
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await pool.query(sql, params);

    res.json({
      success: true,
      count: rows.length,
      owner: req.user.name,            // show who's logged in
      filters: { status: status || null, priority: priority || null },
      data: rows,
    });
  } catch (error) {
    // Pass the error to the global error handler in server.js
    // No need to send the response here — errorHandler does it.
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/tasks/stats
// ─────────────────────────────────────────────────────────────
const getTaskStats = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*)                            AS total,
        SUM(status = 'pending')             AS pending,
        SUM(status = 'in_progress')         AS in_progress,
        SUM(status = 'completed')           AS completed,
        SUM(status = 'cancelled')           AS cancelled,
        SUM(priority = 'high')              AS high_priority,
        SUM(priority = 'medium')            AS medium_priority,
        SUM(priority = 'low')               AS low_priority
      FROM tasks
      WHERE user_id = ?
    `, [req.user.id]);

    res.json({ success: true, owner: req.user.name, stats: rows[0] });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/tasks/:id
// ─────────────────────────────────────────────────────────────
const getTaskById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    // Scope to user_id: can't read another user's task even with a valid ID
    const [rows] = await pool.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );

    if (rows.length === 0) {
      // Create a proper error object and set statusCode on it
      // next(error) sends it to the global error handler
      const error = new Error(`Task with ID ${id} not found`);
      error.statusCode = 404;
      return next(error);
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/tasks
//  Note: title validation is now handled by express-validator
//  in taskRoutes.js — no need to check req.body.title here.
// ─────────────────────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, due_date } = req.body;

    // NOW using real logged-in user ID from JWT token!
    // req.user.id is set by the protect middleware.
    const user_id = req.user.id;

    const [result] = await pool.query(
      "INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)",
      [user_id, title.trim(), description || null, priority || "medium", due_date || null]
    );

    const [newTaskRows] = await pool.query(
      "SELECT * FROM tasks WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: newTaskRows[0],
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  PUT /api/tasks/:id
// ─────────────────────────────────────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, status, priority, due_date } = req.body;

    const setClauses = [];
    const values     = [];

    if (title       !== undefined) { setClauses.push("title = ?");       values.push(title.trim()); }
    if (description !== undefined) { setClauses.push("description = ?"); values.push(description); }
    if (status      !== undefined) { setClauses.push("status = ?");      values.push(status); }
    if (priority    !== undefined) { setClauses.push("priority = ?");    values.push(priority); }
    if (due_date    !== undefined) { setClauses.push("due_date = ?");    values.push(due_date || null); }

    // WHERE id = ? AND user_id = ? — can't update someone else's task
    values.push(id, req.user.id);

    const [result] = await pool.query(
      `UPDATE tasks SET ${setClauses.join(", ")} WHERE id = ? AND user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      const error = new Error(`Task with ID ${id} not found`);
      error.statusCode = 404;
      return next(error);
    }

    const [updatedRows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
    res.json({ success: true, message: "Task updated successfully", data: updatedRows[0] });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/tasks/:id/status
// ─────────────────────────────────────────────────────────────
const updateTaskStatus = async (req, res, next) => {
  try {
    const id         = parseInt(req.params.id);
    const { status } = req.body;

    const [result] = await pool.query(
      "UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?",
      [status, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      const error = new Error(`Task with ID ${id} not found`);
      error.statusCode = 404;
      return next(error);
    }

    const [updatedRows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
    res.json({ success: true, message: `Task status updated to '${status}'`, data: updatedRows[0] });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  DELETE /api/tasks/:id
// ─────────────────────────────────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    // Scope to user_id — can't delete another user's task
    const [rows] = await pool.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );

    if (rows.length === 0) {
      const error = new Error(`Task with ID ${id} not found`);
      error.statusCode = 404;
      return next(error);
    }

    const taskToDelete = rows[0];
    await pool.query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, req.user.id]);

    res.json({ success: true, message: "Task deleted successfully", deleted_task: taskToDelete });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTasks,
  getTaskStats,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
