import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'admin_token';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove(TOKEN_KEY);
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function setToken(token: string) {
  Cookies.set(TOKEN_KEY, token, { expires: 0.5, sameSite: 'strict' });
}

export function clearToken() {
  Cookies.remove(TOKEN_KEY);
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export const adminApi = {
  auth: {
    login: (email: string, password: string) =>
      api.post('/admin/auth/login', { email, password }),
    me: () => api.get('/admin/auth/me'),
    seed: (data: { seedKey: string; email: string; password: string; firstName: string }) =>
      api.post('/admin/auth/seed', data),
    createAdmin: (data: object) => api.post('/admin/auth/create-admin', data),
  },
  dashboard: {
    stats: () => api.get('/admin/dashboard/stats'),
    recentActivity: () => api.get('/admin/dashboard/recent-activity'),
  },
  users: {
    list: (params?: object) => api.get('/admin/users', { params }),
    get: (id: string) => api.get(`/admin/users/${id}`),
    suspend: (id: string, reason?: string) => api.post(`/admin/users/${id}/suspend`, { reason }),
    unsuspend: (id: string) => api.post(`/admin/users/${id}/unsuspend`),
    ban: (id: string, reason?: string) => api.post(`/admin/users/${id}/ban`, { reason }),
    unban: (id: string) => api.post(`/admin/users/${id}/unban`),
    extendTrial: (id: string, days: number) => api.post(`/admin/users/${id}/extend-trial`, { days }),
    activatePremium: (id: string, days: number, plan?: string) =>
      api.post(`/admin/users/${id}/activate-premium`, { days, plan }),
    expire: (id: string) => api.post(`/admin/users/${id}/expire`),
    downgrade: (id: string) => api.post(`/admin/users/${id}/downgrade`),
    delete: (id: string) => api.delete(`/admin/users/${id}`),
  },
  payments: {
    list: (params?: object) => api.get('/admin/payments', { params }),
    get: (id: string) => api.get(`/admin/payments/${id}`),
    approve: (id: string) => api.post(`/admin/payments/${id}/approve`),
    reject: (id: string, reason: string) => api.post(`/admin/payments/${id}/reject`, { reason }),
  },
  qrCodes: {
    list: () => api.get('/admin/qr-codes'),
    update: (provider: string, data: object) => api.put(`/admin/qr-codes/${provider}`, data),
    delete: (provider: string) => api.delete(`/admin/qr-codes/${provider}`),
  },
  announcements: {
    list: (params?: object) => api.get('/admin/announcements', { params }),
    create: (data: object) => api.post('/admin/announcements', data),
    delete: (id: string) => api.delete(`/admin/announcements/${id}`),
  },
  auditLogs: {
    list: (params?: object) => api.get('/admin/audit-logs', { params }),
  },
  settings: {
    get: () => api.get('/admin/settings'),
    update: (key: string, value: unknown) => api.put(`/admin/settings/${key}`, { value }),
    listAdmins: () => api.get('/admin/settings/admins/list'),
    updateAdminPermissions: (id: string, data: object) =>
      api.put(`/admin/settings/admins/${id}/permissions`, data),
  },
};
