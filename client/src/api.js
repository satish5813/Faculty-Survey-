// Backend origin used by the built (production) frontend, e.g. when hosted on Vercel.
// Change this if the API domain changes. VITE_API_URL (if set) still overrides it.
const PROD_API_URL = 'https://mu8xxwppbl1mmtgi5fluzooa.187.127.135.148.sslip.io';

// Resolution:
//  - local dev  -> '' -> BASE '/api' (Vite proxy to localhost:4000)
//  - production -> PROD_API_URL (baked in, no config needed) unless VITE_API_URL overrides
const ENV = (typeof import.meta !== 'undefined' && import.meta.env) || {};
const API_URL = ENV.VITE_API_URL || (ENV.PROD ? PROD_API_URL : '');
const BASE = API_URL ? `${API_URL.replace(/\/$/, '')}/api` : '/api';

function authHeaders() {
  const token = localStorage.getItem('klef_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (!res.ok) {
    let msg = 'Request failed';
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {
      /* ignore */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const api = {
  // Public
  getSurvey: () => fetch(`${BASE}/survey`).then(handle),
  verifyEmail: (email) =>
    fetch(`${BASE}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then(handle),
  submit: (answers, email) =>
    fetch(`${BASE}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, email }),
    }).then(handle),

  // Admin auth
  login: (username, password) =>
    fetch(`${BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(handle),
  me: () => fetch(`${BASE}/admin/me`, { headers: authHeaders() }).then(handle),
  changePassword: (currentPassword, newPassword) =>
    fetch(`${BASE}/admin/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ currentPassword, newPassword }),
    }).then(handle),

  // Admin sections & questions
  getSections: () => fetch(`${BASE}/admin/sections`, { headers: authHeaders() }).then(handle),
  createSection: (data) =>
    fetch(`${BASE}/admin/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    }).then(handle),
  updateSection: (id, data) =>
    fetch(`${BASE}/admin/sections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    }).then(handle),
  deleteSection: (id) =>
    fetch(`${BASE}/admin/sections/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),

  createQuestion: (data) =>
    fetch(`${BASE}/admin/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    }).then(handle),
  updateQuestion: (id, data) =>
    fetch(`${BASE}/admin/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    }).then(handle),
  deleteQuestion: (id) =>
    fetch(`${BASE}/admin/questions/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
  reorderQuestions: (order) =>
    fetch(`${BASE}/admin/questions/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ order }),
    }).then(handle),

  // Admin responses & analytics
  getResponses: (page = 1, pageSize = 20) =>
    fetch(`${BASE}/admin/responses?page=${page}&pageSize=${pageSize}`, { headers: authHeaders() }).then(handle),
  getResponse: (id) => fetch(`${BASE}/admin/responses/${id}`, { headers: authHeaders() }).then(handle),
  deleteResponse: (id) =>
    fetch(`${BASE}/admin/responses/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
  getAnalytics: () => fetch(`${BASE}/admin/analytics`, { headers: authHeaders() }).then(handle),
  getReport: () => fetch(`${BASE}/admin/report`, { headers: authHeaders() }).then(handle),
  getReportDetail: () => fetch(`${BASE}/admin/report/detail`, { headers: authHeaders() }).then(handle),
  exportUrl: `${BASE}/admin/export`,
  exportCsv: async () => {
    const res = await fetch(`${BASE}/admin/export`, { headers: authHeaders() });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'klef_survey_responses.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
};
