import type {
  CommissionPackage,
  CommissionOrder,
  CreateCommissionOrderPayload,
  PaymentResponse,
  ApiEnvelope,
  Post,
  CreatePostPayload,
} from '../types';

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
  liked_post_ids?: number[];
  saved_post_ids?: number[];
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

  if (authenticated && res.status === 401) {
    clearToken();
    clearAuthUser();
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window === 'undefined') return null;
  memoryToken = window.sessionStorage.getItem(TOKEN_KEY);
  return memoryToken;
}

export function setAuthToken(token: string): void {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAuthToken(): void {
  memoryToken = null;
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthUser(): any | null {
  if (typeof window === 'undefined') return null;
  const userStr = window.sessionStorage.getItem('auth_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('auth_user', JSON.stringify(user));
  }
}

export function clearAuthUser(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem('auth_user');
  }
}

async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      clearAuthToken();
      clearAuthUser();
    }

    if (!res.ok) {
      return {
        success: false,
        message: data.message || `HTTP ${res.status}: Request failed`,
        data: data.data || ({} as T),
        errors: data.errors || {},
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal terhubung ke server backend.',
      data: {} as T,
    };
  }
}

export async function getCurrentUser(): Promise<AuthResponse> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: 'Not authenticated' };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/user`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        clearAuthToken();
        clearAuthUser();
      }
      return { success: false, message: data.message || 'Gagal mengambil user.' };
    }
    if (data.data?.user) {
      setAuthUser(data.data.user);
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal terhubung ke server.' };
  }
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
      if (data.data.user) setAuthUser(data.data.user);
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
      if (data.data.user) setAuthUser(data.data.user);
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

export const postsApi = {
  async list(perPage = 15): Promise<ApiEnvelope<{ posts: { data: Post[] } }>> {
    return authFetch<{ posts: { data: Post[] } }>(`/posts?per_page=${perPage}`);
  },

  async get(id: number | string): Promise<ApiEnvelope<{ post: Post }>> {
    return authFetch<{ post: Post }>(`/posts/${id}`);
  },

  async create(payload: CreatePostPayload): Promise<ApiEnvelope<{ post: Post }>> {
    const formData = new FormData();
    formData.append('title', payload.title);
    if (payload.description) formData.append('description', payload.description);
    if (payload.tags) formData.append('tags', payload.tags);
    formData.append('artwork', payload.artwork);

    return authFetch<{ post: Post }>('/posts', {
      method: 'POST',
      body: formData,
    });
  },

  async update(id: number | string, payload: Partial<Omit<CreatePostPayload, 'artwork'>> & { artwork?: File }): Promise<ApiEnvelope<{ post: Post }>> {
    const formData = new FormData();
    if (payload.title !== undefined) formData.append('title', payload.title);
    if (payload.description !== undefined) formData.append('description', payload.description);
    if (payload.tags !== undefined) formData.append('tags', payload.tags);
    if (payload.artwork) formData.append('artwork', payload.artwork);
    formData.append('_method', 'PUT');

    return authFetch<{ post: Post }>(`/posts/${id}`, {
      method: 'POST',
      body: formData,
    });
  },

  async delete(id: number | string): Promise<ApiEnvelope<Record<string, never>>> {
    return authFetch<Record<string, never>>(`/posts/${id}`, { method: 'DELETE' });
  },

  async like(postId: number | string): Promise<ApiEnvelope<{ liked: boolean }>> {
    return authFetch<{ liked: boolean }>(`/posts/${postId}/like`, { method: 'POST' });
  },

  async unlike(postId: number | string): Promise<ApiEnvelope<{ liked: boolean }>> {
    return authFetch<{ liked: boolean }>(`/posts/${postId}/like`, { method: 'DELETE' });
  },

  async save(postId: number | string): Promise<ApiEnvelope<{ saved: boolean }>> {
    return authFetch<{ saved: boolean }>(`/posts/${postId}/save`, { method: 'POST' });
  },

  async unsave(postId: number | string): Promise<ApiEnvelope<{ saved: boolean }>> {
    return authFetch<{ saved: boolean }>(`/posts/${postId}/save`, { method: 'DELETE' });
  },

  async getComments(postId: number | string): Promise<ApiEnvelope<{ comments: any[] }>> {
    return authFetch<{ comments: any[] }>(`/posts/${postId}/comments`);
  },

  async createComment(postId: number | string, body: string): Promise<ApiEnvelope<{ comment: any }>> {
    return authFetch<{ comment: any }>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  },

  async deleteComment(commentId: number | string): Promise<ApiEnvelope<Record<string, never>>> {
    return authFetch<Record<string, never>>(`/comments/${commentId}`, { method: 'DELETE' });
  },
};

export const commissionApi = {
  async getPackages(perPage = 50): Promise<ApiEnvelope<{ packages: { data: CommissionPackage[] } | CommissionPackage[] }>> {
    return authFetch<{ packages: { data: CommissionPackage[] } | CommissionPackage[] }>(`/commission/packages?per_page=${perPage}`);
  },

  async getPackage(id: number): Promise<ApiEnvelope<{ package: CommissionPackage }>> {
    return authFetch<{ package: CommissionPackage }>(`/commission/packages/${id}`);
  },

  async createOrder(payload: CreateCommissionOrderPayload): Promise<ApiEnvelope<{ order: CommissionOrder }>> {
    return authFetch<{ order: CommissionOrder }>('/commission/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getOrders(perPage = 50): Promise<ApiEnvelope<{ orders: { data: CommissionOrder[] } | CommissionOrder[] }>> {
    return authFetch<{ orders: { data: CommissionOrder[] } | CommissionOrder[] }>(`/commission/orders?per_page=${perPage}`);
  },

  async getOrder(id: number | string): Promise<ApiEnvelope<{ order: CommissionOrder }>> {
    return authFetch<{ order: CommissionOrder }>(`/commission/orders/${id}`);
  },

  async createPayment(orderId: number | string): Promise<ApiEnvelope<{ payment: PaymentResponse }>> {
    return authFetch<{ payment: PaymentResponse }>(`/commission/orders/${orderId}/payment`, {
      method: 'POST',
    });
  },

  async startOrder(orderId: number | string): Promise<ApiEnvelope<{ order: CommissionOrder }>> {
    return authFetch<{ order: CommissionOrder }>(`/commission/orders/${orderId}/start`, {
      method: 'POST',
    });
  },

  async deliverOrder(orderId: number | string): Promise<ApiEnvelope<{ order: CommissionOrder }>> {
    return authFetch<{ order: CommissionOrder }>(`/commission/orders/${orderId}/deliver`, {
      method: 'POST',
    });
  },

  async completeOrder(orderId: number | string): Promise<ApiEnvelope<{ order: CommissionOrder }>> {
    return authFetch<{ order: CommissionOrder }>(`/commission/orders/${orderId}/complete`, {
      method: 'POST',
    });
  },

  async cancelOrder(orderId: number | string): Promise<ApiEnvelope<{ order: CommissionOrder }>> {
    return authFetch<{ order: CommissionOrder }>(`/commission/orders/${orderId}/cancel`, {
      method: 'POST',
    });
  },
};

export async function fetchMe(): Promise<AuthUser | null> {
  if (!getToken()) return null;

  try {
    const data = await apiFetch<{
      success?: boolean;
      data?: {
        user?: AuthUser;
        liked_post_ids?: number[];
        saved_post_ids?: number[];
      };
    }>('/user');

    if (data.success === false || !data.data?.user) return null;
    return {
      ...data.data.user,
      liked_post_ids: data.data.liked_post_ids ?? [],
      saved_post_ids: data.data.saved_post_ids ?? [],
    };
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
    clearAuthUser();
  }
}

export function mapPostToArtwork(post: Post): any {
  const user = post.user;
  return {
    id: post.id,
    photoId: post.artwork_url || '',
    aspect: 1,
    title: post.title,
    artist: user ? user.name : 'Unknown',
    artistId: user ? String(user.id) : '',
    avatarBg: 'bg-gray-200',
    initials: (user?.name?.[0] || '?').toUpperCase(),
    likes: 0,
    comments: 0,
    views: 0,
    category: 'Digital Art',
    tags: post.tags ? post.tags.split(',').map((t: string) => t.trim()) : [],
    description: post.description || '',
  };
}
