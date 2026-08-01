import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  Transfer,
  AccountSummary,
  WeeklySummary,
  MonthlySummary,
  Category,
  PaginatedResponse,
  User,
} from '@shared/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://finance-backend-zlt4.onrender.com/api';

class ApiService {
  private token: string | null = null;
  private cache: Map<string, { timestamp: number; data: any }> = new Map();

  setToken(token: string) {
    this.token = token;
  }

  clearCache() {
    this.cache.clear();
  }

  // Only idempotent, read-only requests are safe to retry automatically —
  // retrying a POST/PUT/DELETE on a transient network blip risks double-
  // submitting (e.g. creating a transaction twice), so those get one attempt.
  private static readonly RETRY_DELAYS_MS = [300, 800];

  private async fetch<T>(path: string, options: RequestInit = {}, ttlMs = 0): Promise<T> {
    const isGet = !options.method || options.method === 'GET';
    const cacheKey = `${path}:${this.token || ''}`;

    if (isGet && ttlMs > 0 && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < ttlMs) {
        return cached.data;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const attempts = isGet ? ApiService.RETRY_DELAYS_MS.length + 1 : 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, ApiService.RETRY_DELAYS_MS[attempt - 1]));
      }

      let res: Response;
      try {
        res = await fetch(`${API_BASE}${path}`, { ...options, headers });
      } catch (e) {
        // Network-level failure (offline, DNS, timeout) — retryable for GETs.
        lastError = e;
        continue;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        const message = err.message || err.error || `Request failed: ${res.status}`;
        // Only retry server-side/transient failures, never 4xx client errors
        // (bad request, validation, auth) — those will fail again identically.
        if (res.status >= 500 && attempt < attempts - 1) {
          lastError = new Error(message);
          continue;
        }
        throw new Error(message);
      }

      const json = await res.json();
      if (isGet && ttlMs > 0) {
        this.cache.set(cacheKey, { timestamp: Date.now(), data: json.data });
      }
      return json.data;
    }

    throw lastError instanceof Error ? lastError : new Error('Network error');
  }

  auth = {
    telegram: (initData: string): Promise<{ token: string; user: User }> =>
      this.fetch('/auth/telegram', {
        method: 'POST',
        body: JSON.stringify({ initData }),
      }),
    botToken: (uid: string, tok: string): Promise<{ token: string; user: User }> =>
      this.fetch('/auth/bot-token', {
        method: 'POST',
        body: JSON.stringify({ uid, tok }),
      }),
    me: (): Promise<User> => this.fetch('/auth/me'),
  };

  transactions = {
    list: (params?: {
      page?: number;
      limit?: number;
      type?: string;
      categoryId?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<PaginatedResponse<Transaction>> => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.type) query.set('type', params.type);
      if (params?.categoryId) query.set('categoryId', params.categoryId);
      if (params?.startDate) query.set('startDate', params.startDate);
      if (params?.endDate) query.set('endDate', params.endDate);
      return this.fetch(`/transactions?${query}`, {}, 15000);
    },

    create: async (data: CreateTransactionDto): Promise<Transaction> => {
      this.clearCache();
      return this.fetch('/transactions', { method: 'POST', body: JSON.stringify(data) });
    },

    update: async (id: string, data: UpdateTransactionDto): Promise<Transaction> => {
      this.clearCache();
      return this.fetch(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    delete: async (id: string): Promise<void> => {
      this.clearCache();
      return this.fetch(`/transactions/${id}`, { method: 'DELETE' });
    },
  };

  analytics = {
    weekly: (date?: string): Promise<WeeklySummary> => {
      const query = date ? `?date=${date}` : '';
      return this.fetch(`/analytics/weekly${query}`, {}, 15000);
    },
    monthly: (month?: number, year?: number): Promise<MonthlySummary> => {
      const query = new URLSearchParams();
      if (month) query.set('month', String(month));
      if (year) query.set('year', String(year));
      return this.fetch(`/analytics/monthly?${query}`, {}, 15000);
    },
    reports: (type?: 'weekly' | 'monthly', count?: number): Promise<WeeklySummary[] | MonthlySummary[]> => {
      const query = new URLSearchParams();
      if (type) query.set('type', type);
      if (count) query.set('count', String(count));
      return this.fetch(`/reports?${query}`, {}, 15000);
    },
  };

  accounts = {
    list: (): Promise<{ accounts: Account[]; totalAssets: number }> =>
      this.fetch('/accounts', {}, 15000),
    create: async (data: CreateAccountDto): Promise<Account> => {
      this.clearCache();
      return this.fetch('/accounts', { method: 'POST', body: JSON.stringify(data) });
    },
    update: async (id: string, data: UpdateAccountDto): Promise<Account> => {
      this.clearCache();
      return this.fetch(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    delete: async (id: string): Promise<void> => {
      this.clearCache();
      return this.fetch(`/accounts/${id}`, { method: 'DELETE' });
    },
    transactions: (id: string, page = 1): Promise<PaginatedResponse<Transaction> & { account: Account }> =>
      this.fetch(`/accounts/${id}/transactions?page=${page}&limit=20`, {}, 15000),
    transfer: async (data: Transfer): Promise<{ fromAccount: Account; toAccount: Account }> => {
      this.clearCache();
      return this.fetch('/accounts/transfer', { method: 'POST', body: JSON.stringify(data) });
    },
    summary: (): Promise<AccountSummary> =>
      this.fetch('/analytics/accounts', {}, 15000),
  };

  payments = {
    request: async (data: {
      amount: number;
      currency?: string;
      plan: string;
      durationDays: number;
      qrProvider?: string;
      screenshotUrl?: string;
      note?: string;
    }): Promise<{ id: string; status: string }> => {
      this.clearCache();
      return this.fetch('/payments/request', { method: 'POST', body: JSON.stringify(data) });
    },
    history: (): Promise<{ id: string; status: string; amount: number; plan: string; createdAt: string; reviewedAt?: string }[]> =>
      this.fetch('/payments/my', {}, 15000),
  };

  categories = {
    list: (): Promise<Category[]> => this.fetch('/categories', {}, 60000),
    create: (data: { name: string; label: string; icon: string; color: string; type: 'income' | 'expense' | 'both' }): Promise<Category> =>
      this.fetch('/categories', { method: 'POST', body: JSON.stringify(data) }),
  };

  user = {
    updatePreferences: (data: { currency?: string; timezone?: string }): Promise<{ currency: string; timezone: string }> =>
      this.fetch('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),

    exportData: async (): Promise<void> => {
      const res = await fetch(`${API_BASE}/user/export`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'finance-gm-export.json';
      a.click();
      URL.revokeObjectURL(url);
    },

    deleteAccount: (): Promise<{ message: string }> =>
      this.fetch('/user/account', { method: 'DELETE' }),
  };
}

export const apiService = new ApiService();
