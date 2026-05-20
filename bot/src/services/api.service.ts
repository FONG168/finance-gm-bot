// Calls the backend REST API on behalf of a user (bot context)
// Uses a shared service account JWT or per-user tokens stored in DB

import { WeeklySummary } from '../types';

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.BOT_API_SECRET}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' })) as any;
    throw new Error(err.error || `API error ${res.status}`);
  }

  const json = await res.json() as any;
  return json.data;
}

export async function getUserWeeklySummary(userId: string): Promise<WeeklySummary> {
  return apiFetch<WeeklySummary>(`/analytics/weekly?userId=${userId}`);
}

export async function createTransactionForUser(
  userId: string,
  payload: {
    amount: number;
    type: 'income' | 'expense';
    categoryId: string;
    note?: string;
  },
): Promise<void> {
  await apiFetch(`/transactions`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, userId }),
  });
}
