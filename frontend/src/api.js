const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function getToken() {
  return localStorage.getItem("token") || "";
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

const res = await fetch(`${API_URL}${path}`, {
  ...options,
  headers: {
    ...headers,
    "Cache-Control": "no-store",
    Pragma: "no-cache"
  },
  cache: "no-store"
});
  // Jeśli API padło albo nie odpowiedziało JSON-em, pokaż sensowny błąd:
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export const api = {
  register: (email, password) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  habits: () => request("/habits"),

  createHabit: (payload) =>
    request("/habits", { method: "POST", body: JSON.stringify(payload) }),

  updateHabit: (id, payload) =>
    request(`/habits/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  deleteHabit: (id) =>
    request(`/habits/${id}`, { method: "DELETE" }),

  restoreHabit: (id) =>
    request(`/habits/${id}/restore`, { method: "POST" }),

  checkin: (id, date) =>
    request(`/habits/${id}/checkin`, {
      method: "POST",
      body: JSON.stringify(date ? { date } : {})
    }),

uncheckin: (id, date) =>
  request(`/habits/${id}/uncheckin`, {
    method: "POST",
    body: JSON.stringify(date ? { date } : {})
  }),

  stats: (id, range = 30) =>
    request(`/habits/${id}/stats?range=${range}`),

  checkins: (id, from, to) =>
    request(`/habits/${id}/checkins?from=${from}&to=${to}`)
};
