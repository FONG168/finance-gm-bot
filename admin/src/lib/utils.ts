import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy HH:mm');
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: number | string, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

export function getInitials(firstName?: string, lastName?: string): string {
  return [(firstName || '').charAt(0), (lastName || '').charAt(0)].join('').toUpperCase() || '??';
}

export const PERMISSIONS = [
  'manage_users',
  'manage_subscriptions',
  'manage_payments',
  'manage_balances',
  'manage_roles',
  'view_reports',
  'manage_settings',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ADMIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MODERATOR: 'bg-green-500/20 text-green-400 border-green-500/30',
  SUPPORT_AGENT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export const PLAN_COLORS: Record<string, string> = {
  PREMIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  LIFETIME: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  FREE: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export const PLAN_VARIANTS: Record<string, string> = {
  PREMIUM: 'warning', LIFETIME: 'purple', FREE: 'gray',
};

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
  TRIAL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  EXPIRED: 'bg-red-500/20 text-red-400 border-red-500/30',
  SUSPENDED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  APPROVED: 'bg-green-500/20 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
};
