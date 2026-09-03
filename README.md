# 📋 Task Manager REST API

A complete, production-ready REST API for managing tasks. Built from scratch with **Node.js**, **Express**, and **MySQL** — featuring JWT authentication, password hashing, input validation, and security hardening.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js | JavaScript on the server |
| Framework | Express.js | HTTP routing and middleware |
| Database | MySQL | Persistent data storage |
| DB Driver | mysql2/promise | Async MySQL queries with connection pooling |
| Auth | jsonwebtoken (JWT) | Stateless authentication tokens |
| Passwords | bcryptjs | One-way password hashing |
| Validation | express-validator | Input validation and sanitization |
| Security | helmet | Secure HTTP headers |
| Security | cors | Cross-origin request control |
| Security | express-rate-limit | Brute-force and DDoS protection |
| Dev | nodemon | Auto-restart server on file changes |

---

## ✅ Features

- 🔐 **User Registration** — Create an account with a hashed password
- 🔑 **JWT Login / Logout** — Stateless authentication with expiring tokens
- ✅ **Task CRUD** — Create, Read, Update, Delete tasks
- 🔒 **Protected Routes** — All task routes require a valid JWT token
- 👤 **User Isolation** — Each user only sees and manages their own tasks
- 🛡️ **Security Hardened** — Helmet headers, CORS, rate limiting, parameterized queries
- 📋 **Input Validation** — All inputs validated before hitting the database
- ❌ **Centralized Error Handling** — Consistent error format across all routes

---

## 📦 Prerequisites

Make sure you have these installed before starting:

- **Node.js** v18 or higher → [nodejs.org](https://nodejs.org)
- **MySQL** v8 or higher → [mysql.com](https://dev.mysql.com/downloads/)
- **Postman** (for API testing) → [postman.com](https://www.postman.com/downloads/)
- **MySQL Workbench** (optional, for visual DB management)

Verify installations:
```bash
node --version     # should show v18+
npm --version      # should show 9+
mysql --version    # should show 8+
```

---

## 🚀 Installation & Setup

### Step 1 — Clone or download the project

```bash
# If using git:
git clone <your-repo-url>
cd crud

# Or just open the folder in your terminal
cd C:\path\to\crud
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs all packages listed in `package.json` into `node_modules/`.

### Step 3 — Configure environment variables

Create a `.env` file in the root folder (copy the example below):

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=task_manager_db

# JWT
JWT_SECRET=your_long_random_secret_here_minimum_32_characters
JWT_EXPIRES_IN=7d

# CORS (optional — defaults to * if not set)
CORS_ORIGIN=*
```

> ⚠️ **Never commit `.env` to git!** It's already in `.gitignore`.

**Generating a strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste it as your `JWT_SECRET`.

### Step 4 — Set up the MySQL database

1. Make sure MySQL is running (check MySQL Workbench — can you connect? If yes, MySQL is running)
2. Open MySQL Workbench (or any MySQL client)
3. Open the file `database/schema.sql`
4. Run the entire file

This creates:
- The `task_manager_db` database
- The `users` table
- The `tasks` table (with foreign key to users)
- Sample data (2 users, 6 tasks)

Verify it worked:
```sql
USE task_manager_db;
SHOW TABLES;          -- should show: tasks, users
SELECT * FROM users;  -- should show 2 sample users
SELECT * FROM tasks;  -- should show 6 sample tasks
```

### Step 5 — Start the server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

**Expected terminal output:**
```
✅ MySQL connected successfully!

🚀 Server running — Stage 11: Security Hardened
   http://localhost:3000

   POST   /api/auth/register  (limit: 10/15min)
   POST   /api/auth/login     (limit: 10/15min)
   GET    /api/tasks          (JWT required)
   ...
```

Open your browser: **http://localhost:3000** — you should see the API info page.

---

## 📡 API Reference

### Base URL
```
http://localhost:3000
```

### Authentication

All task routes require a JWT token in the `Authorization` header:
```
Authorization: Bearer <your_token_here>
```

Get your token by logging in (see below).

---

### 🔑 Auth Routes

#### Register a new account

```
POST /api/auth/register
```

**Request body:**
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "mypassword123"
}
```

**Success response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully! You can now log in.",
  "user": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "is_active": 1,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Validation rules:**
- `name`: required, 2–100 characters
- `email`: required, valid email format
- `password`: required, minimum 6 characters

**Rate limit:** 10 requests per 15 minutes per IP.

---

#### Login

```
POST /api/auth/login
```

**Request body:**
```json
{
  "email": "alice@example.com",
  "password": "mypassword123"
}
```

**Success response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com"
  }
}
```

> 💡 **Copy the `token` value** — you'll use it in all task requests.

**Rate limit:** 10 requests per 15 minutes per IP.

---

#### Logout

Logout is handled **client-side**. Simply delete the token from your storage. No server endpoint needed (JWT is stateless).

---

### ✅ Task Routes

> All task routes require `Authorization: Bearer <token>` header.

---

#### Get all tasks

```
GET /api/tasks
```

Optional query filters:
```
GET /api/tasks?status=pending
GET /api/tasks?priority=high
GET /api/tasks?status=pending&priority=high
```

**Success response (200 OK):**
```json
{
  "success": true,
  "count": 3,
  "owner": "Alice Johnson",
  "filters": { "status": "pending", "priority": null },
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Learn Node.js",
      "description": null,
      "status": "completed",
      "priority": "high",
      "due_date": null,
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### Get task statistics

```
GET /api/tasks/stats
```

**Success response (200 OK):**
```json
{
  "success": true,
  "owner": "Alice Johnson",
  "stats": {
    "total": "6",
    "pending": "2",
    "in_progress": "1",
    "completed": "3",
    "cancelled": "0",
    "high_priority": "3",
    "medium_priority": "2",
    "low_priority": "1"
  }
}
```

---

#### Get one task

```
GET /api/tasks/:id
```

**Example:** `GET /api/tasks/1`

**Success response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "Learn Node.js",
    "status": "completed",
    "priority": "high",
    "due_date": null,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error response (404):**
```json
{
  "success": false,
  "message": "Task with ID 999 not found"
}
```

---

#### Create a task

```
POST /api/tasks
```

**Request body:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "priority": "medium",
  "due_date": "2024-12-31"
}
```

| Field | Required | Type | Values |
|---|---|---|---|
| `title` | ✅ Yes | string | max 255 chars |
| `description` | No | string | any |
| `priority` | No | string | `low`, `medium`, `high` (default: `medium`) |
| `due_date` | No | date | `YYYY-MM-DD` format |

**Success response (201 Created):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 7,
    "user_id": 1,
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "pending",
    "priority": "medium",
    "due_date": "2024-12-31",
    "created_at": "2024-01-15T11:00:00.000Z"
  }
}
```

---

#### Update a task

```
PUT /api/tasks/:id
```

Send only the fields you want to change — all fields are optional.

**Request body (example — update just status):**
```json
{
  "status": "in_progress"
}
```

| Field | Type | Values |
|---|---|---|
| `title` | string | max 255 chars |
| `description` | string | any |
| `status` | string | `pending`, `in_progress`, `completed`, `cancelled` |
| `priority` | string | `low`, `medium`, `high` |
| `due_date` | date | `YYYY-MM-DD` or `null` |

**Success response (200 OK):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": { "...updated task..." }
}
```

---

#### Update task status only

```
PATCH /api/tasks/:id/status
```

**Request body:**
```json
{
  "status": "completed"
}
```

Valid values: `pending` | `in_progress` | `completed` | `cancelled`

---

#### Delete a task

```
DELETE /api/tasks/:id
```

**Success response (200 OK):**
```json
{
  "success": true,
  "message": "Task deleted successfully",
  "deleted_task": { "...the deleted task..." }
}
```

---

### ❌ Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

**Validation errors (422):**
```json
{
  "success": false,
  "message": "Validation failed. Check the errors array.",
  "errors": [
    { "msg": "Title is required", "path": "title", "location": "body" },
    { "msg": "Priority must be low, medium, or high", "path": "priority", "location": "body" }
  ]
}
```

**HTTP Status Codes used:**

| Code | Meaning |
|---|---|
| 200 | OK — request successful |
| 201 | Created — resource was created |
| 400 | Bad Request — malformed request |
| 401 | Unauthorized — not logged in / bad token |
| 404 | Not Found — resource doesn't exist |
| 409 | Conflict — email already registered |
| 422 | Unprocessable Entity — validation failed |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error — something went wrong |

---

## 🧪 Testing with Postman

### Quick Start

1. Start the server: `npm run dev`
2. Open Postman
3. Follow this sequence:

```
Step 1: Register        POST /api/auth/register
Step 2: Login           POST /api/auth/login  ← copy the "token"
Step 3: Use the token   Authorization: Bearer <token>  on all task routes
```

### Setting up the Authorization header in Postman

**Method 1 (Auth tab — easiest):**
1. Open any task request
2. Click the **Auth** tab
3. Select **Bearer Token** from the dropdown
4. Paste your token in the Token field

**Method 2 (Environment variable — best for many requests):**
1. Create a Postman Environment: "Task Manager Dev"
2. Add variable: `token` = (leave empty)
3. In your login request → **Tests** tab, add:
   ```javascript
   pm.environment.set("token", pm.response.json().token);
   ```
4. Now every login auto-saves the token
5. In other requests, use `{{token}}` in the Bearer Token field

### Complete Test Sequence

```
# Auth
POST   /api/auth/register          {"name":"Test User","email":"test@x.com","password":"test123"}
POST   /api/auth/login             {"email":"test@x.com","password":"test123"}

# Tasks (add Authorization: Bearer <token> to all)
GET    /api/tasks
GET    /api/tasks/stats
GET    /api/tasks/1
POST   /api/tasks                  {"title":"My task","priority":"high"}
PUT    /api/tasks/1                {"status":"completed"}
PATCH  /api/tasks/1/status         {"status":"in_progress"}
DELETE /api/tasks/1
```

---

## 📁 Project Structure

```
crud/
├── config/
│   └── db.js                    # MySQL connection pool
├── controllers/
│   ├── authController.js        # register, login logic
│   └── taskController.js        # CRUD logic (scoped to logged-in user)
├── database/
│   └── schema.sql               # Database DDL — run this first!
├── middleware/
│   ├── authMiddleware.js        # JWT verification (protect)
│   ├── errorMiddleware.js       # 404 + global error handler
│   ├── securityMiddleware.js    # Rate limiters
│   └── validate.js              # Validation error checker
├── notes/                       # Stage-by-stage learning journal
│   ├── stage_01_setup_and_express.txt
│   ├── stage_02_http_and_routes.txt
│   ├── stage_03_mysql_database.txt
│   ├── stage_04_mysql_connection.txt
│   ├── stage_05_real_crud.txt
│   ├── stage_06_architecture.txt
│   ├── stage_07_validation_errors.txt
│   ├── stage_08_registration_hashing.txt
│   ├── stage_09_login_jwt.txt
│   ├── stage_10_auth_middleware.txt
│   └── stage_11_security.txt
├── routes/
│   ├── authRoutes.js            # /api/auth/* routes
│   └── taskRoutes.js            # /api/tasks/* routes (protected)
├── .env                         # Environment variables (not in git!)
├── .gitignore
├── package.json
├── README.md
└── server.js                    # App entry point
```

---

## 🔒 Security Features

| Feature | Implementation |
|---|---|
| Secure HTTP headers | `helmet` — sets 11+ headers automatically |
| CORS control | `cors` — configurable allowed origins |
| Rate limiting | `express-rate-limit` — 10/15min auth, 100/15min API |
| Authentication | JWT tokens with expiry (`JWT_EXPIRES_IN`) |
| Password storage | `bcrypt` — salted hashing with 12 salt rounds |
| SQL Injection | Parameterized queries (`?` placeholders) |
| Input validation | `express-validator` — validated before DB |
| User data isolation | All queries scoped to `user_id = req.user.id` |
| Error safety | Stack traces hidden in production (`NODE_ENV=production`) |

---

## 🌍 Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | — | `development` or `production` |
| `DB_HOST` | Yes | — | MySQL host (usually `localhost`) |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_USER` | Yes | — | MySQL username |
| `DB_PASSWORD` | Yes | — | MySQL password |
| `DB_NAME` | Yes | — | Database name (`task_manager_db`) |
| `JWT_SECRET` | Yes | — | Long random string for signing tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Token validity (`7d`, `1h`, `30m`) |
| `CORS_ORIGIN` | No | `*` | Allowed origin (e.g., `https://myapp.com`) |

---

## 🗄️ Database Schema

### users table

| Column | Type | Description |
|---|---|---|
| `id` | INT, PK, AUTO_INCREMENT | Unique user ID |
| `name` | VARCHAR(100) | Display name |
| `email` | VARCHAR(255), UNIQUE | Login email |
| `password_hash` | VARCHAR(255) | bcrypt hash (never plain text) |
| `is_active` | BOOLEAN | Account active flag |
| `created_at` | DATETIME | Account creation time |
| `updated_at` | DATETIME | Last update time |

### tasks table

| Column | Type | Description |
|---|---|---|
| `id` | INT, PK, AUTO_INCREMENT | Unique task ID |
| `user_id` | INT, FK → users.id | Owner of the task |
| `title` | VARCHAR(255) | Task title |
| `description` | TEXT | Optional details |
| `status` | ENUM | `pending`, `in_progress`, `completed`, `cancelled` |
| `priority` | ENUM | `low`, `medium`, `high` |
| `due_date` | DATE | Optional deadline |
| `created_at` | DATETIME | Creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

---

## 🛠️ Troubleshooting

**Server won't start — MySQL connection failed:**
```
❌ MySQL connection failed: Access denied for user 'root'@'localhost'
```
→ Check `DB_PASSWORD` in your `.env` file. It must match your MySQL password.

**Server won't start — Unknown database:**
```
❌ MySQL connection failed: Unknown database 'task_manager_db'
```
→ You haven't run `database/schema.sql` yet. Run it in MySQL Workbench.

**Can't connect to MySQL at all:**
```
❌ MySQL connection failed: connect ECONNREFUSED 127.0.0.1:3306
```
→ MySQL server is not running.
- Windows: Open Services (`services.msc`) → find `MySQL80` → Start
- Or open MySQL Workbench — it usually starts MySQL automatically.

**Got 401 on task routes:**
→ You need to include the token. Login first, then add `Authorization: Bearer <token>` header.

**Got 429 Too Many Requests:**
→ You've hit the rate limit. Wait 15 minutes (or restart the server to reset — limits are in-memory).

---

## 📚 Learning Resources

If you built this project to learn, here are good next steps:

- **Deploy your API** — Try [Render.com](https://render.com) (free tier) or [Railway.app](https://railway.app)
- **Add a Frontend** — Build a React or Vue app that calls this API
- **Learn TypeScript** — Add types to your Node.js project
- **Testing** — Learn Jest + Supertest to write automated API tests
- **Documentation** — Add Swagger/OpenAPI auto-documentation
- **Caching** — Add Redis for token blacklisting and response caching

---

## 📄 License

ISC — free to use for learning and personal projects.
