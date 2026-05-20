// Shared types used across frontend, backend, and bot

export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'cash' | 'bank' | 'ewallet' | 'savings' | 'credit';

export type CategoryName =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'bills'
  | 'health'
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'other';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'LIFETIME';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';

export interface User {
  id: string;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  languageCode?: string;
  currency: string;
  timezone: string;
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string | null;
  premiumStartedAt?: string | null;
  premiumExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: CategoryName;
  label: string;
  icon: string;
  color: string;
  type: TransactionType | 'both';
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isArchived: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  category?: Category;
  accountId?: string;
  account?: Account;
  transferId?: string;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
  date?: string;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
  color?: string;
  icon?: string;
  isArchived?: boolean;
}

export interface AccountSummary {
  totalAssets: number;
  totalCash: number;
  totalBank: number;
  totalEwallet: number;
  totalSavings: number;
  accounts: Account[];
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  category?: Category;
  amount: number;
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  topCategory: string;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  categoryBreakdown: CategoryBreakdown[];
  weeklyTrends: WeeklyTrend[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: CategoryName;
  label: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface WeeklyTrend {
  weekNumber: number;
  weekStart: string;
  income: number;
  expenses: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateTransactionDto {
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId?: string;
  note?: string;
  date?: string;
}

export interface UpdateTransactionDto {
  amount?: number;
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  note?: string;
  date?: string;
}

export interface AuthPayload {
  userId: string;
  telegramId: number;
  firstName: string;
}

// Telegram WebApp types
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramInitDataUnsafe;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready(): void;
  expand(): void;
  close(): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  HapticFeedback: TelegramHapticFeedback;
  BackButton: TelegramBackButton;
  MainButton: TelegramMainButton;
}

export interface TelegramInitDataUnsafe {
  user?: TelegramUser;
  query_id?: string;
  auth_date: number;
  hash: string;
  start_param?: string;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

export interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

export interface TelegramBackButton {
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(callback: () => void): void;
}

export interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  show(): void;
  hide(): void;
  enable(): void;
  disable(): void;
  showProgress(leaveActive?: boolean): void;
  hideProgress(): void;
  onClick(callback: () => void): void;
  setParams(params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
  }): void;
}

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'food', label: 'Food & Dining', icon: '🍔', color: '#FF6B6B', type: 'expense' },
  { id: 'transport', name: 'transport', label: 'Transport', icon: '🚗', color: '#4ECDC4', type: 'expense' },
  { id: 'entertainment', name: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#45B7D1', type: 'expense' },
  { id: 'shopping', name: 'shopping', label: 'Shopping', icon: '🛍️', color: '#96CEB4', type: 'expense' },
  { id: 'bills', name: 'bills', label: 'Bills & Utilities', icon: '📄', color: '#FFEAA7', type: 'expense' },
  { id: 'health', name: 'health', label: 'Health', icon: '❤️', color: '#DDA0DD', type: 'expense' },
  { id: 'salary', name: 'salary', label: 'Salary', icon: '💼', color: '#98FB98', type: 'income' },
  { id: 'freelance', name: 'freelance', label: 'Freelance', icon: '💻', color: '#87CEEB', type: 'income' },
  { id: 'investment', name: 'investment', label: 'Investment', icon: '📈', color: '#F0E68C', type: 'income' },
  { id: 'other', name: 'other', label: 'Other', icon: '📦', color: '#D3D3D3', type: 'both' },
];
