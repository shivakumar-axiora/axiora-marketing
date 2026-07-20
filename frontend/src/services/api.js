import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const TOKEN_KEY = "axiora_access";
export const REFRESH_KEY = "axiora_refresh";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (!refresh) {
        forceLogout();
        return Promise.reject(error);
      }
      try {
        refreshing =
          refreshing ||
          axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh });
        const { data } = await refreshing;
        refreshing = null;
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(REFRESH_KEY, data.refresh_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        forceLogout();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

function forceLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  if (window.location.pathname !== "/login") window.location.href = "/login";
}

export function getErrorMessage(error, fallback = "Something went wrong") {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  return error?.message || fallback;
}

export default api;
