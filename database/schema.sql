-- ================================================================
-- schema.sql — Database Schema for Task Manager API
-- ================================================================
-- What is this file?
--   This file contains all the SQL commands to CREATE our database
--   and tables. Run this once in MySQL Workbench to set everything up.
--
-- How to run it:
--   1. Open MySQL Workbench
--   2. Connect to your local server
--   3. Open this file: File → Open SQL Script → select this file
--   4. Click the lightning bolt ⚡ button (Execute All)
--   OR copy-paste the whole file into the query editor and run it.
--
-- After running, you'll have:
--   Database: task_manager_db
--   Tables:   users, tasks
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- STEP 1: Create the Database
-- ────────────────────────────────────────────────────────────────
-- "IF NOT EXISTS" means: don't crash if it already exists.
-- CHARACTER SET utf8mb4: supports all Unicode characters (emojis too!)
-- COLLATE utf8mb4_unicode_ci: case-insensitive string comparisons
--   (so "Hello" and "hello" are treated the same in searches)
-- ────────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS task_manager_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Tell MySQL: "use this database for all following commands"
USE task_manager_db;


-- ────────────────────────────────────────────────────────────────
-- STEP 2: Create the "users" Table
-- ────────────────────────────────────────────────────────────────
-- This table stores everyone who registers for the app.
-- Each row = one user account.
--
-- Why do we store password_hash and NOT the plain password?
--   NEVER store plain passwords! If someone hacks the database,
--   they'd get everyone's password. We store a "hash" — a one-way
--   scrambled version. bcryptjs does the hashing in Stage 8.
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  -- id: the unique identifier for each user
  --   INT          = a whole number (1, 2, 3, ...)
  --   AUTO_INCREMENT = MySQL automatically assigns the next number
  --   PRIMARY KEY  = this column uniquely identifies each row
  id            INT           AUTO_INCREMENT PRIMARY KEY,

  -- name: the user's display name
  --   VARCHAR(100) = a variable-length string, max 100 characters
  --   NOT NULL     = this column CANNOT be empty/missing
  name          VARCHAR(100)  NOT NULL,

  -- email: must be unique (no two users with same email)
  --   UNIQUE = MySQL enforces no duplicate values in this column
  email         VARCHAR(150)  NOT NULL UNIQUE,

  -- password_hash: the bcrypt hash of the user's password
  --   VARCHAR(255) = bcrypt hashes are ~60 chars, 255 is safe buffer
  password_hash VARCHAR(255)  NOT NULL,

  -- is_active: whether the account is active (soft disable feature)
  --   BOOLEAN    = true (1) or false (0)
  --   DEFAULT 1  = new users start as active
  is_active     BOOLEAN       NOT NULL DEFAULT 1,

  -- created_at: when was this account created
  --   TIMESTAMP      = stores date + time
  --   DEFAULT NOW()  = automatically fills in current time on INSERT
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),

  -- updated_at: when was this account last changed
  --   ON UPDATE NOW() = automatically updates to current time on UPDATE
  updated_at    TIMESTAMP     NOT NULL DEFAULT NOW() ON UPDATE NOW()
);


-- ────────────────────────────────────────────────────────────────
-- STEP 3: Create the "tasks" Table
-- ────────────────────────────────────────────────────────────────
-- This table stores all tasks created by all users.
-- Each row = one task.
-- Each task BELONGS TO a user (via user_id foreign key).
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          INT           AUTO_INCREMENT PRIMARY KEY,

  -- user_id: which user owns this task
  --   This is a FOREIGN KEY — it references the id column in users table.
  --   This creates a RELATIONSHIP between tasks and users.
  --   A task MUST belong to a user that exists in the users table.
  user_id     INT           NOT NULL,

  -- title: the main text of the task (e.g., "Buy groceries")
  --   NOT NULL = every task must have a title
  title       VARCHAR(255)  NOT NULL,

  -- description: optional longer notes about the task
  --   TEXT = unlimited length text (unlike VARCHAR which has a limit)
  --   NULL = this column CAN be empty (it's optional)
  description TEXT          NULL,

  -- status: where is the task in its lifecycle?
  --   ENUM = only allows these specific values (like a dropdown)
  --   DEFAULT 'pending' = new tasks start as pending
  status      ENUM('pending', 'in_progress', 'completed', 'cancelled')
                            NOT NULL DEFAULT 'pending',

  -- priority: how urgent is this task?
  priority    ENUM('low', 'medium', 'high')
                            NOT NULL DEFAULT 'medium',

  -- due_date: optional deadline for the task
  --   DATE = stores only a date (no time): e.g., "2024-12-31"
  --   NULL = allowed (task might not have a deadline)
  due_date    DATE          NULL,

  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP     NOT NULL DEFAULT NOW() ON UPDATE NOW(),

  -- FOREIGN KEY CONSTRAINT
  -- This tells MySQL: user_id must match an existing id in users table.
  -- ON DELETE CASCADE = if a user is deleted, delete ALL their tasks too.
  --   (no "orphan" tasks floating around without an owner)
  CONSTRAINT fk_tasks_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);


-- ────────────────────────────────────────────────────────────────
-- STEP 4: Add Indexes for Performance
-- ────────────────────────────────────────────────────────────────
-- An INDEX is like the index at the back of a book.
-- Without it, MySQL reads EVERY row to find what you want (slow).
-- With it, MySQL jumps straight to the right rows (fast).
--
-- We add indexes on columns we'll frequently search/filter by.
-- ────────────────────────────────────────────────────────────────

-- Index on user_id in tasks: we'll often query "tasks WHERE user_id = ?"
CREATE INDEX idx_tasks_user_id   ON tasks(user_id);

-- Index on status: we'll often filter "tasks WHERE status = 'pending'"
CREATE INDEX idx_tasks_status    ON tasks(status);

-- Index on priority: for filtering by priority
CREATE INDEX idx_tasks_priority  ON tasks(priority);

-- Index on email in users: login searches by email every time
-- (Note: UNIQUE already creates an index, this is just for documentation)
-- CREATE INDEX idx_users_email ON users(email); ← already indexed by UNIQUE


-- ────────────────────────────────────────────────────────────────
-- STEP 5: Insert Sample Data (for testing)
-- ────────────────────────────────────────────────────────────────
-- This gives us some test data to work with.
-- NOTE: In real code, passwords are hashed by bcryptjs.
-- "$2a$10$..." below is a bcrypt hash of the password "password123"
-- ────────────────────────────────────────────────────────────────

INSERT INTO users (name, email, password_hash) VALUES
  ('Alice Johnson', 'alice@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
  ('Bob Smith',     'bob@example.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT INTO tasks (user_id, title, description, status, priority, due_date) VALUES
  (1, 'Learn Node.js',       'Complete the Node.js tutorial',      'completed', 'high',   '2024-01-15'),
  (1, 'Learn Express',       'Build REST APIs with Express',        'completed', 'high',   '2024-01-20'),
  (1, 'Connect MySQL',       'Set up mysql2 and connection pool',   'pending',   'high',   '2024-01-25'),
  (1, 'Add Authentication',  'JWT login and registration system',   'pending',   'high',   '2024-02-01'),
  (2, 'Read SQL Basics',     'Learn SELECT, INSERT, UPDATE, DELETE','in_progress','medium', '2024-01-22'),
  (2, 'Practice Postman',    'Test all API endpoints',              'pending',   'low',    NULL        );


-- ────────────────────────────────────────────────────────────────
-- STEP 6: Verify everything was created correctly
-- ────────────────────────────────────────────────────────────────
-- These SELECT statements let you verify the data was inserted.
-- You can run them separately in MySQL Workbench to check.
-- ────────────────────────────────────────────────────────────────

-- See all users (without showing password hash for security)
SELECT id, name, email, is_active, created_at FROM users;

-- See all tasks with the owner's name (JOIN example!)
SELECT
  t.id,
  t.title,
  t.status,
  t.priority,
  t.due_date,
  u.name AS owner_name
FROM tasks t
JOIN users u ON t.user_id = u.id
ORDER BY t.id;

-- Count tasks per user
SELECT
  u.name,
  COUNT(t.id)                                          AS total_tasks,
  SUM(t.status = 'completed')                          AS completed,
  SUM(t.status = 'pending')                            AS pending,
  SUM(t.status = 'in_progress')                        AS in_progress
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
GROUP BY u.id, u.name;
