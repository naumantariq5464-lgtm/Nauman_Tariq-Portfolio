/* ============================================================
   config.js — API base URL and shared fetch helper
   Change API_BASE_URL when deploying to production
   ============================================================ */

const CONFIG = {
  // Development — change to your deployed backend URL in production
  API_BASE_URL: 'http://127.0.0.1:8000/api/v1',

  // Token storage keys
  TOKEN_KEY:   'nt_access_token',
  REFRESH_KEY: 'nt_refresh_token',
};

/* ── Auth helpers ─────────────────────────────────────────── */
const Auth = {
  getToken()         { return localStorage.getItem(CONFIG.TOKEN_KEY); },
  getRefresh()       { return localStorage.getItem(CONFIG.REFRESH_KEY); },
  setTokens(a, r)    {
    localStorage.setItem(CONFIG.TOKEN_KEY, a);
    localStorage.setItem(CONFIG.REFRESH_KEY, r);
  },
  clear()            {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.REFRESH_KEY);
  },
  isLoggedIn()       { return !!this.getToken(); },
};

/* ── Fetch wrapper ────────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const url = CONFIG.API_BASE_URL + path;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Remove Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(url, { ...options, headers });

  // Auto-refresh token on 401
  if (res.status === 401 && Auth.getRefresh()) {
    const refreshed = await _refreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${Auth.getToken()}`;
      return fetch(url, { ...options, headers });
    } else {
      Auth.clear();
      window.location.href = '/frontend/index.html';
      return;
    }
  }

  return res;
}

async function _refreshToken() {
  try {
    const res = await fetch(CONFIG.API_BASE_URL + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: Auth.getRefresh() }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    Auth.setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}
