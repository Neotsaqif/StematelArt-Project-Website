// API Service Client for ARTVAULT Backend

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: AuthUser;
    token: string;
  };
  errors?: Record<string, string[]>;
}

const API_BASE_URL = '/api';
const TOKEN_KEY = 'auth_token';
let memoryToken: string | null = null;

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window === 'undefined') return null;

  memoryToken = window.sessionStorage.getItem(TOKEN_KEY);
  return memoryToken;
}

export function setToken(token: string): void {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  memoryToken = null;
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(data?.message || 'Permintaan ke server gagal');
    this.status = status;
    this.data = data;
  }
}

async function readResponse(res: Response): Promise<Record<string, any>> {
  try {
    const data = await res.json();
    return data && typeof data === 'object' ? data : {
      success: false,
      message: 'Server mengembalikan response yang tidak valid.',
    };
  } catch {
    return {
      success: false,
      message: 'Server mengembalikan response yang tidak valid.',
    };
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (authenticated) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const data = await readResponse(res);

  if (authenticated && res.status === 401) clearToken();
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const data = await apiFetch<AuthResponse>('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, false);

    if (data.data?.token) {
      setToken(data.data.token);
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal terhubung ke server backend.',
      errors: err.data?.errors || {},
    };
  }
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const data = await apiFetch<AuthResponse>('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, false);

    if (data.data?.token) {
      setToken(data.data.token);
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal terhubung ke server backend.',
      errors: err.data?.errors || {},
    };
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  if (!getToken()) return null;

  try {
    const data = await apiFetch<{
      success?: boolean;
      data?: { user?: AuthUser };
    }>('/user');

    if (data.success === false) return null;
    return data.data?.user ?? null;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    if (getToken()) await apiFetch('/logout', { method: 'POST' });
  } catch {
  } finally {
    clearToken();
  }
}
