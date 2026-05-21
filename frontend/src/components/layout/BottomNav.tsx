'use client';

import '@/lib/i18n';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Wallet, Plus, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';
import { useTranslation } from 'react-i18next';

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

  const navigate = (href: string) => {
    haptic.selection();
    router.push(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{ background: 'hsl(235, 42%, 8%)', borderTop: '1px solid hsl(235, 28%, 18%)' }}
    >
      <div className="flex items-end justify-around px-2 sm:px-6 py-2 max-w-2xl mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <button key={item.href} onClick={() => navigate(item.href)} className="flex flex-col items-center -mt-7">
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-violet-950/60"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </motion.div>
                <span className="text-[10px] mt-1 text-muted-foreground font-medium">{t(item.key)}</span>
              </button>
            );
          }

          return (
            <button key={item.href} onClick={() => navigate(item.href)} className="flex flex-col items-center gap-1 min-w-[52px] py-1">
              <motion.div whileTap={{ scale: 0.85 }}>
                <Icon className={cn('w-5 h-5 transition-colors', isActive ? 'text-violet-400' : 'text-muted-foreground')} />
              </motion.div>
              <span className={cn('text-[10px] font-medium transition-colors', isActive ? 'text-violet-400' : 'text-muted-foreground')}>
                {t(item.key)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
