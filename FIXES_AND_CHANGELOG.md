# 🛠️ Fixes, Issues & Changelog

This document explains all the issues encountered during development, why they happened, and exactly what changes were made to fix them.

---

## 📋 Table of Contents
1. [Issue 1: "Database doesn't exist" on Register](#1-issue-1-database-doesnt-exist-on-register)
2. [Issue 2: "Login again" / 401 Error when Creating a Task](#2-issue-2-login-again--401-error-when-creating-a-task)
3. [Issue 3: Tasks Not Showing / Showing Count 0](#3-issue-3-tasks-not-showing--showing-count-0)
4. [Issue 4: Empty Optional Fields Failing Backend Validation](#4-issue-4-empty-optional-fields-failing-backend-validation)
5. [Issue 5: Session Stuck on 401 / Malformed Tokens](#5-issue-5-session-stuck-on-401--malformed-tokens)
6. [Issue 6: CSS Linter Warnings in VSCode](#6-issue-6-css-linter-warnings-in-vscode)
7. [Summary of Files Created & Modified](#7-summary-of-files-created--modified)

---

## 1. Issue 1: "Database doesn't exist" on Register

### 🔴 The Problem
When trying to register from the frontend, the backend returned:
```
ER_BAD_DB_ERROR: Unknown database 'task_manager_db'
```

### 🔍 Root Cause
The Node.js backend connects to MySQL using a connection pool pointing to `DB_NAME=task_manager_db`. Because MySQL was installed but the `task_manager_db` database and its tables (`users`, `tasks`) had not yet been created, any query to the database failed.

### 💡 The Fix
Created a one-click automated database initialization script: [`setup-db.js`](file:///c:/Users/sr333/OneDrive/Desktop/crud/setup-db.js).
- Connects to MySQL root server without requiring the database to exist first.
- Executes `CREATE DATABASE IF NOT EXISTS task_manager_db`.
- Reads and executes [`database/schema.sql`](file:///c:/Users/sr333/OneDrive/Desktop/crud/database/schema.sql) to create `users`, `tasks`, indexes, and foreign keys.

---

## 2. Issue 2: "Login again" / 401 Error when Creating a Task

### 🔴 The Problem
After registering, navigating to the dashboard and clicking **"Create Task"** showed an error:
```
"Access denied. Invalid token. Please log in again."
```

### 🔍 Root Cause
- In the backend architecture, `POST /api/auth/register` creates the user in MySQL and returns user details **WITHOUT a JWT token** (as designed in Stage 8).
- Only `POST /api/auth/login` generates and issues the signed JWT token.
- In the frontend `AuthContext.jsx`, `register` was trying to save `localStorage.setItem('token', data.token)` where `data.token` was `undefined`.
- In JavaScript, `localStorage.setItem('token', undefined)` saves the literal string `"undefined"`.
- When making task requests, the header sent `Authorization: Bearer undefined`, which failed `jwt.verify()` on the backend with a `401 Unauthorized`.

### 💡 The Fix
Modified [`frontend/src/AuthContext.jsx`](file:///c:/Users/sr333/OneDrive/Desktop/crud/frontend/src/AuthContext.jsx):
```javascript
// Automatically logs in right after registration to acquire valid JWT token
const register = useCallback(async (name, email, password) => {
  await api.register({ name, email, password });
  const loginData = await api.login({ email, password });
  localStorage.setItem('token', loginData.token);
  localStorage.setItem('user', JSON.stringify(loginData.user));
  setUser(loginData.user);
}, []);
```

---

## 3. Issue 3: Tasks Not Showing / Showing Count 0

### 🔴 The Problem
When adding a task or viewing the dashboard, the task list remained empty and stats showed `0`.

### 🔍 Root Cause
1. **API Response Key Mismatch:** The backend route `GET /api/tasks` returned:
   ```json
   {
     "success": true,
     "count": 1,
     "owner": "John",
     "data": [ ... ]
   }
   ```
   The frontend was reading `t.tasks || t` instead of `t.data`. Because `t.tasks` was undefined, `tasks` state received the entire wrapper object instead of the array.
2. **Delayed Re-fetch:** The dashboard relied solely on an asynchronous re-fetch after modal close instead of immediately updating local state.

### 💡 The Fix
Modified [`frontend/src/components/Dashboard.jsx`](file:///c:/Users/sr333/OneDrive/Desktop/crud/frontend/src/components/Dashboard.jsx):
1. Correctly mapped `t.data`:
   ```javascript
   const taskList = res.data || res.tasks || (Array.isArray(res) ? res : []);
   setTasks(taskList);
   ```
2. Implemented **instant reactive state updates**:
   ```javascript
   function handleTaskSaved(savedTask) {
     if (savedTask && savedTask.id) {
       setTasks(prev => {
         const exists = prev.some(t => t.id === savedTask.id);
         if (exists) {
           return prev.map(t => t.id === savedTask.id ? { ...t, ...savedTask } : t);
         }
         return [savedTask, ...prev];
       });
     }
     reload();
   }
   ```

---

## 4. Issue 4: Empty Optional Fields Failing Backend Validation

### 🔴 The Problem
Submitting a new task without a due date or description could cause a `422 Unprocessable Entity` validation error.

### 🔍 Root Cause
The backend uses `express-validator` with `body("due_date").optional().isDate()`.
When an empty string `""` was sent in the JSON body:
- `isDate()` evaluated `""` as an invalid date and rejected the request.

### 💡 The Fix
Modified [`TaskModal` in `Dashboard.jsx`](file:///c:/Users/sr333/OneDrive/Desktop/crud/frontend/src/components/Dashboard.jsx) to sanitize payload before sending:
```javascript
const body = {
  title: form.title.trim(),
  priority: form.priority,
};
if (form.description && form.description.trim()) {
  body.description = form.description.trim();
}
if (form.due_date) {
  body.due_date = form.due_date;
}
if (isEdit) {
  body.status = form.status;
}
```

---

## 5. Issue 5: Session Stuck on 401 / Malformed Tokens

### 🔴 The Problem
If a token expired or was corrupted, the dashboard remained open in a broken state with failing background requests.

### 💡 The Fix
1. **Token Sanitizer in [`frontend/src/api.js`](file:///c:/Users/sr333/OneDrive/Desktop/crud/frontend/src/api.js):**
   ```javascript
   function getToken() {
     const token = localStorage.getItem('token');
     if (!token || token === 'undefined' || token === 'null') return null;
     return token;
   }
   ```
2. **Auto-Logout Event:**
   - When any API call receives a `401 Unauthorized`, `api.js` clears `localStorage` and dispatches `auth:logout`.
   - `AuthContext.jsx` listens for this event and resets `user` to `null`, instantly bringing the user back to the login screen.

---

## 6. Issue 6: CSS Linter Warnings in VSCode

### 🔴 The Problem
VSCode's Problems tab (`Ctrl + Shift + M`) showed 3 warnings about vendor prefixes (`-webkit-line-clamp`, `-webkit-box-orient`).

### 💡 The Fix
In [`frontend/src/components/Dashboard.css`](file:///c:/Users/sr333/OneDrive/Desktop/crud/frontend/src/components/Dashboard.css), replaced vendor-prefixed multi-line clamp with clean standard CSS properties (`max-height` and `overflow: hidden`).

---

## 7. Summary of Files Created & Modified

| File | Type | Purpose |
|------|------|---------|
| [`setup-db.js`](file:///c:/Users/sr333/OneDrive/Desktop/crud/setup-db.js) | **Created** | Automated MySQL database creation & schema execution |
| [`frontend/`](file:///c:/Users/sr333/OneDrive/Desktop/crud/frontend/) | **Created** | Complete React + Vite Single Page Application |
| [`frontend/src/api.js`](file:///c:/Users/sr333/OneDrive/Desktop/crud/frontend/src/api.js) | **Created** | Centralized API client with JWT auth headers & 401 handler |
| [`frontend/src/AuthContext.jsx`](file:///c:/Users/sr333/OneDrive/Desktop/crud/frontend/src/AuthContext.jsx) | **Created** | Authentication provider with auto-login on registration |
| [`frontend/src/components/Dashboard.jsx`](file:///c:/Users/sr333/OneDrive/Desktop/crud/frontend/src/components/Dashboard.jsx) | **Created** | Responsive task manager dashboard with modals, search & filters |
| [`frontend/src/components/AuthPage.jsx`](file:///c:/Users/sr333/OneDrive/Desktop/crud/frontend/src/components/AuthPage.jsx) | **Created** | Login & Registration interface |
| [`frontend/vite.config.js`](file:///c:/Users/sr333/OneDrive/Desktop/crud/frontend/vite.config.js) | **Created** | Vite dev server proxy (`/api` → `http://localhost:3000`) |
| **Backend files** (`server.js`, `controllers/`, `routes/`) | **Untouched** | Preserved 100% of existing backend architecture |

---

## 🚀 How to Run the Project

1. **Start Backend (Terminal 1):**
   ```powershell
   npm run dev
   ```
   *(Runs on http://localhost:3000)*

2. **Start Frontend (Terminal 2):**
   ```powershell
   cd frontend
   npm run dev
   ```
   *(Runs on http://localhost:5173)*
