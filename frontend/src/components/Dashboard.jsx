// src/components/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import './Dashboard.css';

// ─── Helpers ──────────────────────────────────────────────────────
const STATUS_OPTIONS = ['pending', 'in_progress', 'completed', 'cancelled'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

function statusLabel(s) {
  if (!s) return 'Pending';
  return s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString();
}

function initials(name = '') {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── TaskModal ─────────────────────────────────────────────────────
function TaskModal({ task, onClose, onSaved }) {
  const isEdit = Boolean(task?.id);
  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    priority:    task?.priority    || 'medium',
    status:      task?.status      || 'pending',
    due_date:    task?.due_date    ? task.due_date.slice(0, 10) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
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

      let savedResult;
      if (isEdit) {
        savedResult = await api.updateTask(task.id, body);
      } else {
        savedResult = await api.createTask(body);
      }
      
      const savedTask = savedResult?.data || savedResult?.task || savedResult;
      onSaved(savedTask);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? '✏️ Edit Task' : '➕ New Task'}</span>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="task-title">Title *</label>
            <input
              id="task-title"
              className="input"
              name="title"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={255}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              className="input"
              name="description"
              placeholder="Optional details..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="modal-form-row">
            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select id="task-priority" className="input filter-select" name="priority" value={form.priority} onChange={handleChange}>
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>

            {isEdit && (
              <div className="form-group">
                <label htmlFor="task-status">Status</label>
                <select id="task-status" className="input filter-select" name="status" value={form.status} onChange={handleChange}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="task-due">Due Date</label>
              <input
                id="task-due"
                className="input"
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <div className="auth-error">⚠️ {error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : (isEdit ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DeleteConfirm ─────────────────────────────────────────────────
function DeleteConfirm({ task, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await api.deleteTask(task.id);
      onDeleted(task.id);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <span className="modal-title">🗑️ Delete Task</span>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{task.title}"</strong>?
          This cannot be undone.
        </p>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TaskCard ──────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const formattedDueDate = formatDate(task.due_date);
  const formattedCreatedAt = formatDate(task.created_at);

  return (
    <div className="task-card">
      <div className="task-card-left">
        <div className="task-card-top">
          <span className={`task-title ${task.status === 'completed' ? 'done' : ''}`}>
            {task.title}
          </span>
          <span className={`badge badge-${task.status}`}>{statusLabel(task.status)}</span>
          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        </div>

        {task.description && (
          <div className="task-desc">{task.description}</div>
        )}

        <div className="task-meta">
          {formattedDueDate && (
            <span className="task-meta-item">
              📅 {formattedDueDate}
            </span>
          )}
          {formattedCreatedAt && (
            <span className="task-meta-item">
              🕐 {formattedCreatedAt}
            </span>
          )}

          {/* Quick status change */}
          <select
            className="filter-select"
            value={task.status || 'pending'}
            onChange={e => onStatusChange(task.id, e.target.value)}
            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
            onClick={e => e.stopPropagation()}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="task-actions">
        <button
          className="btn btn-icon btn-secondary btn-sm"
          onClick={() => onEdit(task)}
          title="Edit"
        >✏️</button>
        <button
          className="btn btn-icon btn-danger btn-sm"
          onClick={() => onDelete(task)}
          title="Delete"
        >🗑️</button>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth();

  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [search,         setSearch]         = useState('');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [modalTask,  setModalTask]  = useState(undefined); // undefined=closed, null=new, obj=edit
  const [deleteTask, setDeleteTask] = useState(null);

  // Fetch tasks
  const reload = useCallback(async () => {
    setFetchError('');
    try {
      const res = await api.getTasks();
      const taskList = res.data || res.tasks || (Array.isArray(res) ? res : []);
      setTasks(taskList);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setFetchError(err.message || 'Failed to load tasks from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    reload(); 
  }, [reload]);

  async function handleStatusChange(id, status) {
    try {
      await api.updateStatus(id, status);
      setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  }

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

  function handleTaskDeleted(deletedId) {
    setTasks(prev => prev.filter(t => t.id !== deletedId));
    reload();
  }

  // Filtered tasks
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const filtered = taskArray.filter(t => {
    if (!t) return false;
    const titleMatch = !search || (t.title && t.title.toLowerCase().includes(search.toLowerCase()));
    const descMatch = !search || (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    const matchSearch = titleMatch || descMatch;
    const matchStatus   = filterStatus === 'all'   || t.status   === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  // Stats derived from tasks
  const total     = taskArray.length;
  const completed = taskArray.filter(t => t?.status === 'completed').length;
  const pending   = taskArray.filter(t => t?.status === 'pending').length;
  const inProgress= taskArray.filter(t => t?.status === 'in_progress').length;

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-brand-icon">✅</div>
          Task Manager
        </div>
        <div className="navbar-user">
          <div className="navbar-avatar">{initials(user?.name)}</div>
          <span className="navbar-name">{user?.name || user?.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout} id="btn-logout">
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="dashboard-main">
        {fetchError && (
          <div className="auth-error" style={{ marginBottom: 20 }}>
            ⚠️ {fetchError} — Try signing out and logging in again.
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Tasks',  value: total,       sub: 'all tasks' },
            { label: 'Completed',    value: completed,   sub: `${total ? Math.round(completed/total*100) : 0}% done` },
            { label: 'In Progress',  value: inProgress,  sub: 'active now' },
            { label: 'Pending',      value: pending,     sub: 'not started' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <span className="toolbar-title">My Tasks ({filtered.length})</span>

          {/* Search */}
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="task-search"
            />
          </div>

          {/* Filter by status */}
          <select
            className="filter-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            id="filter-status"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>

          {/* Filter by priority */}
          <select
            className="filter-select"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            id="filter-priority"
          >
            <option value="all">All Priority</option>
            {PRIORITY_OPTIONS.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            onClick={() => setModalTask(null)}
            id="btn-new-task"
          >
            + New Task
          </button>
        </div>

        {/* Tasks */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>{total === 0 ? 'No tasks yet' : 'No matching tasks'}</h3>
            <p>{total === 0
              ? 'Click "+ New Task" to create your first task!'
              : 'Try adjusting your search or filters.'
            }</p>
          </div>
        ) : (
          <div className="tasks-container">
            {filtered.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={t => setModalTask(t)}
                onDelete={t => setDeleteTask(t)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(undefined)}
          onSaved={handleTaskSaved}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTask && (
        <DeleteConfirm
          task={deleteTask}
          onClose={() => setDeleteTask(null)}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}
