// src/api.js — Centralised API helper
const BASE = '/api';

function getToken() {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') return null;
  return token;
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    const msg =
      data?.errors?.[0]?.msg ||
      data?.message ||
      data?.error ||
      'Something went wrong';
    throw new Error(msg);
  }
  return data;
}

export const api = {
  // Auth
  register: (body) => request('POST', '/auth/register', body),
  login:    (body) => request('POST', '/auth/login', body),

  // Tasks
  getTasks:    ()       => request('GET',    '/tasks'),
  getStats:    ()       => request('GET',    '/tasks/stats'),
  getTask:     (id)     => request('GET',    `/tasks/${id}`),
  createTask:  (body)   => request('POST',   '/tasks', body),
  updateTask:  (id, body) => request('PUT',  `/tasks/${id}`, body),
  updateStatus:(id, status) => request('PATCH', `/tasks/${id}/status`, { status }),
  deleteTask:  (id)     => request('DELETE', `/tasks/${id}`),
};
