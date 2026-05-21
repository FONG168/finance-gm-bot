'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import {
  BarChart3,
  Users,
  CreditCard,
  Star,
  QrCode,
  Megaphone,
  ScrollText,
  Settings,
  LogOut,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react';

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null, badgeKey: null },
  { label: 'Users', href: '/users', icon: Users, permission: 'manage_users', badgeKey: null },
  { label: 'Payments', href: '/payments', icon: CreditCard, permission: 'manage_payments', badgeKey: 'payments' },
  { label: 'Subscriptions', href: '/subscriptions', icon: Star, permission: 'manage_subscriptions', badgeKey: 'subscriptions' },
  { label: 'Revenue', href: '/revenue', icon: BarChart3, permission: 'view_reports', badgeKey: null },
  { label: 'QR Codes', href: '/qr-codes', icon: QrCode, permission: 'manage_settings', badgeKey: null },
  { label: 'Announcements', href: '/announcements', icon: Megaphone, permission: 'manage_settings', badgeKey: null },
  { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText, permission: 'view_reports', badgeKey: null },
  { label: 'Settings', href: '/settings', icon: Settings, permission: 'manage_settings', badgeKey: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const { admin, logout, hasPermission } = useAuth();
  const [badges, setBadges] = useState<{ payments: number; subscriptions: number }>({ payments: 0, subscriptions: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [paymentsRes, subsRes] = await Promise.all([
          adminApi.payments.list({ status: 'PENDING', limit: 1 }),
          adminApi.users.list({ plan: 'PREMIUM', subscriptionStatus: 'ACTIVE', expiringSoonDays: 7, limit: 1 }),
        ]);
        setBadges({
          payments: paymentsRes.data?.data?.pagination?.total ?? 0,
          subscriptions: subsRes.data?.data?.pagination?.total ?? 0,
        });
      } catch {
        // silently fail — badges just won't show
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const visibleNav = nav.filter(item => !item.permission || hasPermission(item.permission));

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 border border-primary/30">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Finance GM</p>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {visibleNav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const badgeCount = item.badgeKey ? badges[item.badgeKey as keyof typeof badges] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
              {active && !badgeCount && <ChevronRight className="h-3 w-3 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Admin profile */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-bold">
            {admin?.firstName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{admin?.firstName} {admin?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{admin?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-red-950 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
