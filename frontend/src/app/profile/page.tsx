'use client';

import { motion } from 'framer-motion';
import { Settings, HelpCircle, Shield, ChevronRight, LogOut } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';

const MENU_ITEMS = [
  { icon: Settings, label: 'Settings', description: 'App preferences' },
  { icon: Shield, label: 'Privacy & Security', description: 'Data & permissions' },
  { icon: HelpCircle, label: 'Help & Support', description: 'FAQ & contact' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { close } = useTelegram();

  const initials = user
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'FG';

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-4 pt-5 pb-3 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold">Profile</h1>
      </div>

      <div className="px-4 max-w-2xl mx-auto space-y-4">
        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #3b1278 0%, #5b21b6 45%, #312e81 100%)' }}
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold overflow-hidden">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="text-lg font-bold">
                {user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Loading...'}
              </p>
              {user?.username && (
                <p className="text-sm text-white/60">@{user.username}</p>
              )}
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/80 tracking-wide mt-1 inline-block">
                PRO MEMBER
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Currency', value: user?.currency || 'USD' },
            { label: 'Timezone', value: (user?.timezone || 'UTC').replace('_', ' ') },
            { label: 'Since', value: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '—' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-card border border-border p-3 text-center">
              <p className="font-bold text-sm">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Menu items */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border/50">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* AI features teaser */}
        <div className="rounded-2xl border-2 border-dashed border-violet-500/30 p-4 text-center">
          <p className="text-2xl mb-1">🤖</p>
          <p className="font-semibold text-sm">AI Insights Coming Soon</p>
          <p className="text-xs text-muted-foreground mt-1">
            Smart expense categorization, budget recommendations, and spending insights.
          </p>
        </div>

        {/* Close app */}
        <button
          onClick={close}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Close App
        </button>

        <p className="text-center text-xs text-muted-foreground pb-2">Finance GM v1.0.0</p>
      </div>

      <BottomNav />
    </div>
  );
}
