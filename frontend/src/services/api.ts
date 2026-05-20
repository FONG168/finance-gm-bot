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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.message || err.error || `Request failed: ${res.status}`);
    }

    const json = await res.json();
    return json.data;
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
      return this.fetch(`/transactions?${query}`);
    },

    create: (data: CreateTransactionDto): Promise<Transaction> =>
      this.fetch('/transactions', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: string, data: UpdateTransactionDto): Promise<Transaction> =>
      this.fetch(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: string): Promise<void> =>
      this.fetch(`/transactions/${id}`, { method: 'DELETE' }),
  };

  analytics = {
    weekly: (date?: string): Promise<WeeklySummary> => {
      const query = date ? `?date=${date}` : '';
      return this.fetch(`/analytics/weekly${query}`);
    },
    monthly: (month?: number, year?: number): Promise<MonthlySummary> => {
      const query = new URLSearchParams();
      if (month) query.set('month', String(month));
      if (year) query.set('year', String(year));
      return this.fetch(`/analytics/monthly?${query}`);
    },
    reports: (type?: 'weekly' | 'monthly', count?: number): Promise<WeeklySummary[] | MonthlySummary[]> => {
      const query = new URLSearchParams();
      if (type) query.set('type', type);
      if (count) query.set('count', String(count));
      return this.fetch(`/reports?${query}`);
    },
  };

  accounts = {
    list: (): Promise<{ accounts: Account[]; totalAssets: number }> =>
      this.fetch('/accounts'),
    create: (data: CreateAccountDto): Promise<Account> =>
      this.fetch('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateAccountDto): Promise<Account> =>
      this.fetch(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> =>
      this.fetch(`/accounts/${id}`, { method: 'DELETE' }),
    transactions: (id: string, page = 1): Promise<PaginatedResponse<Transaction> & { account: Account }> =>
      this.fetch(`/accounts/${id}/transactions?page=${page}&limit=20`),
    transfer: (data: Transfer): Promise<{ fromAccount: Account; toAccount: Account }> =>
      this.fetch('/accounts/transfer', { method: 'POST', body: JSON.stringify(data) }),
    summary: (): Promise<AccountSummary> =>
      this.fetch('/analytics/accounts'),
  };

  payments = {
    request: (data: {
      amount: number;
      currency?: string;
      plan: string;
      durationDays: number;
      qrProvider?: string;
      screenshotUrl?: string;
      note?: string;
    }): Promise<{ id: string; status: string }> =>
      this.fetch('/payments/request', { method: 'POST', body: JSON.stringify(data) }),
  };

  categories = {
    list: (): Promise<Category[]> => this.fetch('/categories'),
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
