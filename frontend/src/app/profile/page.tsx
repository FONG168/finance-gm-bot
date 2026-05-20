'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Shield, ChevronRight, LogOut, X, Send } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';

const SUPPORT_USERNAME = 'smart_money_management_admin';
const SUPPORT_URL = `https://t.me/${SUPPORT_USERNAME}`;

function TelegramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function SupportModal({ onClose }: { onClose: () => void }) {
  const { webApp } = useTelegram();

  const openChat = () => {
    if (webApp?.openLink) {
      webApp.openLink(SUPPORT_URL);
    } else {
      window.open(SUPPORT_URL, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-sm relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-3xl blur-xl opacity-30"
            style={{ background: 'linear-gradient(135deg, #229ED9, #1a7fad)' }} />

          {/* Card */}
          <div className="relative rounded-3xl overflow-hidden border"
            style={{
              background: 'linear-gradient(160deg, #1a2332 0%, #0f1923 100%)',
              borderColor: 'rgba(34,158,217,0.35)',
              boxShadow: '0 0 0 1px rgba(34,158,217,0.15), 0 24px 48px rgba(0,0,0,0.5)',
            }}>

            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #229ED9, #1a7fad, #229ED9)' }} />

            <div className="p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <X className="w-4 h-4 text-white/60" />
              </button>

              {/* Telegram icon */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
                  style={{ background: 'linear-gradient(135deg, #229ED9, #1a7fad)' }}>
                  <div className="absolute inset-0 rounded-2xl blur-md opacity-50"
                    style={{ background: '#229ED9' }} />
                  <TelegramIcon className="w-9 h-9 text-white relative z-10" />
                </div>
              </div>

              {/* Title & description */}
              <h2 className="text-xl font-bold text-white text-center mb-2">
                Telegram Support
              </h2>
              <p className="text-sm text-center mb-5" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: '1.6' }}>
                Need help or have questions? Chat directly with our support admin on Telegram.
              </p>

              {/* Username badge */}
              <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-2xl mx-auto w-fit"
                style={{ background: 'rgba(34,158,217,0.12)', border: '1px solid rgba(34,158,217,0.25)' }}>
                <TelegramIcon className="w-4 h-4" style={{ color: '#229ED9' }} />
                <span className="text-sm font-semibold" style={{ color: '#229ED9' }}>
                  @{SUPPORT_USERNAME}
                </span>
              </div>

              {/* CTA Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={openChat}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #229ED9, #1a7fad)' }}
              >
                <div className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity"
                  style={{ background: 'white' }} />
                <Send className="w-4 h-4" />
                Open Telegram Chat
              </motion.button>

              <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Opens in Telegram
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const MENU_ITEMS = [
  { icon: Settings, label: 'Settings', description: 'App preferences', action: null },
  { icon: Shield, label: 'Privacy & Security', description: 'Data & permissions', action: null },
  {
    icon: TelegramIcon,
    label: 'Telegram Support',
    description: 'Chat directly with support admin',
    action: 'support',
    accent: true,
  },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { close } = useTelegram();
  const [showSupport, setShowSupport] = useState(false);

  const initials = user
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'FG';

  const handleMenuItem = (action: string | null) => {
    if (action === 'support') setShowSupport(true);
  };

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
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuItem(item.action)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 active:bg-secondary/70 transition-colors text-left"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={item.accent
                    ? { background: 'rgba(34,158,217,0.15)', border: '1px solid rgba(34,158,217,0.25)' }
                    : { background: 'var(--secondary)' }
                  }
                >
                  <Icon
                    className="w-4 h-4"
                    style={item.accent ? { color: '#229ED9' } : { color: 'var(--muted-foreground)' }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={item.accent ? { color: '#229ED9' } : {}}>
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
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

      {/* Support modal */}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
    </div>
  );
}
