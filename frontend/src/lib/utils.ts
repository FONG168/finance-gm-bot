import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import i18n from './i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  if (currency === 'KHR') {
    return `៛${Math.round(amount).toLocaleString('en-US')}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const TZ = 'Asia/Phnom_Penh';

// Telegram WebView doesn't support km-KH/zh-CN Intl locales — use manual month arrays
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_KM = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];
const MONTHS_ZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

function getMonthName(monthIndex: number): string {
  const lang = i18n.language;
  if (lang === 'km') return MONTHS_KM[monthIndex];
  if (lang === 'zh') return MONTHS_ZH[monthIndex];
  return MONTHS_EN[monthIndex];
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Use manual month names for non-en locales to avoid WebView Intl support gaps
  const lang = i18n.language;
  if ((lang === 'km' || lang === 'zh') && !options) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'numeric', day: 'numeric', year: 'numeric' }).formatToParts(d);
    const p: Record<string, string> = {};
    parts.forEach(x => { p[x.type] = x.value; });
    return `${getMonthName(parseInt(p.month) - 1)} ${p.day}, ${p.year}`;
  }
  return d.toLocaleDateString('en-US', { timeZone: TZ, ...(options || { month: 'short', day: 'numeric', year: 'numeric' }) });
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Compare calendar dates in Phnom Penh timezone
  const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const txnDay = dayFmt.format(d);
  const todayDay = dayFmt.format(now);

  if (txnDay === todayDay) return i18n.t('common.today');

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (txnDay === dayFmt.format(yesterday)) return i18n.t('common.yesterday');

  const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return i18n.t('common.daysAgo', { n: diffDays });
  return formatDate(d, { timeZone: TZ, month: 'short', day: 'numeric' });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}

export function formatPercentage(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}
