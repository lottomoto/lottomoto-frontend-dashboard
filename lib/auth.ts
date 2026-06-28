import api, { clearAccessToken, getAccessToken, setAccessToken } from "./api";

export interface AuthUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  setAccessToken(data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // Local logout should still complete if the session is already invalid.
  }
  clearAccessToken();
  localStorage.removeItem("user");
  window.location.href = "/login";
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getAccessToken();
}

export function isAuthenticated(): boolean {
  if (getToken()) return true;
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("user");
}
