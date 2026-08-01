'use client';

import '@/lib/i18n';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Wallet, Plus, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';
import { useTranslation } from 'react-i18next';

import Link from 'next/link';
import { useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/', icon: Home, key: 'nav.home' },
  { href: '/accounts', icon: Wallet, key: 'nav.accounts' },
  { href: '/add', icon: Plus, key: 'nav.add', primary: true },
  { href: '/reports', icon: BarChart3, key: 'nav.reports' },
  { href: '/profile', icon: User, key: 'nav.profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { haptic } = useTelegram();
  const { t } = useTranslation('common');

  useEffect(() => {
    NAV_ITEMS.forEach((item) => router.prefetch(item.href));
  }, [router]);

  const handleTap = (isPrimary?: boolean) => {
    if (isPrimary) {
      haptic.impact('light');
    } else {
      haptic.selection();
    }
  };

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 max-w-lg mx-auto pointer-events-auto">
      <div className="glass-dock rounded-3xl p-2 shadow-xl relative">
        <div className="flex items-center justify-around relative z-10">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => handleTap(true)}
                  className="flex flex-col items-center relative -mt-6 group active:scale-95 transition-transform duration-75"
                >
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg bg-violet-600 border border-violet-400/20 text-white">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] mt-1 text-muted-foreground font-semibold tracking-wide">
                    {t(item.key)}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => handleTap(false)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 min-w-[54px] py-1.5 px-3 rounded-2xl relative transition-all duration-75 active:scale-95',
                  isActive ? 'bg-violet-500/10 text-violet-600 font-bold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors duration-100',
                    isActive ? 'text-violet-600' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-100',
                    isActive ? 'text-violet-600 font-bold' : 'text-muted-foreground'
                  )}
                >
                  {t(item.key)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

