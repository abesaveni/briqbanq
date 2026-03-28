import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser set Content-Type automatically for FormData (preserves multipart boundary)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — clear session and notify app to redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/identity/login') || url.includes('/identity/me');
    const isNotificationEndpoint = url.includes('/notifications');
    if (error.response?.status === 401 && !isNotificationEndpoint && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("currentRole");
      // Dispatch event so AuthContext can call logout() — avoids hard page reload
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/** Create a WebSocket connection. Automatically includes the path. */
export function createWebSocket(path) {
  const wsBase = (import.meta.env.VITE_WS_URL || window.location.origin).replace(/^http/, "ws");
  return new WebSocket(`${wsBase}${path}`);
}

export default api;
