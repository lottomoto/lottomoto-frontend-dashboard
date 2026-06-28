import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let memoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  if (memoryAccessToken) return memoryAccessToken;
  if (typeof window === "undefined") return null;
  memoryAccessToken = sessionStorage.getItem("access_token");
  return memoryAccessToken;
}

export function setAccessToken(token: string) {
  memoryAccessToken = token;
  if (typeof window !== "undefined") {
    sessionStorage.setItem("access_token", token);
  }
}

export function clearAccessToken() {
  memoryAccessToken = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("access_token");
  }
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

function processQueue(error: any, token: string | null) {
  failedQueue.forEach((p) => {
    if (token) p.resolve(token);
    else p.reject(error);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== "undefined") {
      const isLoginPage = window.location.pathname === "/login";
      if (isLoginPage) return Promise.reject(error);

      if (!localStorage.getItem("user")) {
        clearAccessToken();
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        setAccessToken(data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
