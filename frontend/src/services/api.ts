import type {
  CommissionPackage,
  CommissionOrder,
  CreateCommissionOrderPayload,
  PaymentResponse,
  ApiEnvelope,
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

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
      bio?: string | null;
      avatar?: string | null;
    };
    token: string;
  };
  errors?: Record<string, string[]>;
}

const API_BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function getAuthUser(): any | null {
  const userStr = localStorage.getItem('auth_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
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
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      return { success: false, message: data.message || 'Gagal mengambil user.' };
    }
    if (data.data?.user) {
      localStorage.setItem('auth_user', JSON.stringify(data.data.user));
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal terhubung ke server.' };
  }
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'Pendaftaran gagal',
        errors: data.errors || {},
      };
    }

    if (data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.data.user));
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal terhubung ke server backend.',
    };
  }
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'Masuk gagal',
        errors: data.errors || {},
      };
    }

    if (data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.data.user));
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal terhubung ke server backend.',
    };
  }
}

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

