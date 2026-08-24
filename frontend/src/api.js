// One place that talks to the API so every page does not repeat the fetch setup.

const TOKEN_KEY = 'ett_token';

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// throws an Error with the server message on it, so pages can just catch and show
// err.message. Field errors ride along for showing under each input.
async function callApi(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });

  let body = {};
  try {
    body = await res.json();
  } catch (e) {
    // some responses have no body, that is fine
  }

  if (!res.ok) {
    const error = new Error(body.message || 'Something went wrong');
    error.status = res.status;
    error.errors = body.errors || {};
    error.seatsRemaining = body.seatsRemaining;

    // token is stale, clear it and the app drops back to login
    if (res.status === 401) clearToken();

    throw error;
  }

  return body;
}

export const api = {
  register: (data) => callApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => callApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => callApi('/auth/me'),

  listEvents: () => callApi('/events'),
  getEvent: (id) => callApi(`/events/${id}`),
  myEvents: () => callApi('/events/mine'),
  createEvent: (data) => callApi('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id, data) => callApi(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  cancelEvent: (id) => callApi(`/events/${id}/cancel`, { method: 'POST' }),
  eventBookings: (id) => callApi(`/events/${id}/bookings`),

  book: (data) => callApi('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  myBookings: () => callApi('/bookings/mine'),
  cancelBooking: (id) => callApi(`/bookings/${id}/cancel`, { method: 'POST' })
};
