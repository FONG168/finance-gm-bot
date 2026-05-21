'use client';

import '@/lib/i18n';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Shield, ChevronRight, X, Send, Crown, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { PaymentQRSheet } from '@/components/subscription/PaymentQRSheet';

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
  const { t } = useTranslation('common');

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
                {t('support.title')}
              </h2>
              <p className="text-sm text-center mb-5" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: '1.6' }}>
                {t('support.desc')}
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
                {t('support.openChat')}
              </motion.button>

              <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {t('support.opensIn')}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [showSupport, setShowSupport] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const initials = user
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'FG';

  const MENU_ITEMS = [
    { icon: Settings, label: t('profile.settings'), description: t('profile.settingsDesc'), action: 'settings' },
    { icon: Shield, label: t('profile.privacy'), description: t('profile.privacyDesc'), action: 'privacy' },
    {
      icon: TelegramIcon,
      label: t('profile.support'),
      description: t('profile.supportDesc'),
      action: 'support',
      accent: true,
    },
  ];

  const handleMenuItem = (action: string | null) => {
    if (action === 'support') setShowSupport(true);
    if (action === 'settings') router.push('/settings');
    if (action === 'privacy') router.push('/privacy');
  };

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-4 pt-5 pb-3 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold">{t('profile.title')}</h1>
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
                {t('profile.proMember')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Currency */}
          <div className="rounded-2xl bg-card border border-border p-3 text-center">
            <p className="font-bold text-sm">{user?.currency || 'USD'}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('profile.currency')}</p>
          </div>

          {/* Live clock */}
          {(() => {
            // Use stored timezone if explicitly set; otherwise auto-detect from browser
            const stored = user?.timezone || 'UTC';
            const tz = stored === 'UTC' ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') : stored;
            const city = tz.replace(/_/g, ' ').split('/').pop() ?? tz;
            // Compute GMT offset by comparing UTC vs target timezone time strings
            const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit' });
            const tzStr  = now.toLocaleString('en-US', { timeZone: tz,    hour12: false, hour: '2-digit', minute: '2-digit' });
            const [uh, um] = utcStr.split(':').map(Number);
            const [th, tm] = tzStr.split(':').map(Number);
            const diffMin = (th * 60 + tm) - (uh * 60 + um);
            const sign = diffMin >= 0 ? '+' : '-';
            const abs = Math.abs(diffMin);
            const offsetLabel = `GMT${diffMin === 0 ? '+0' : `${sign}${Math.floor(abs / 60)}${abs % 60 ? ':' + String(abs % 60).padStart(2, '0') : ''}`}`;
            return (
              <div className="rounded-2xl bg-card border border-border p-3 text-center">
                <p className="font-bold text-sm tabular-nums">
                  {now.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{offsetLabel}</p>
                {city && <p className="text-[9px] text-muted-foreground/50 truncate leading-tight">{city}</p>}
              </div>
            );
          })()}

          {/* Member since */}
          <div className="rounded-2xl bg-card border border-border p-3 text-center">
            <p className="font-bold text-sm">{user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '—'}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('profile.since')}</p>
          </div>
        </div>

        {/* Upgrade / Renewal card */}
        {(() => {
          const status = user?.subscriptionStatus;
          const plan = user?.plan;
          const trialEnd = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
          const premiumEnd = user?.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
          const now2 = new Date();

          const isTrial = status === 'TRIAL';
          const isExpired = status === 'EXPIRED';
          const isPremiumExpiringSoon = plan === 'PREMIUM' && status === 'ACTIVE' && premiumEnd && (premiumEnd.getTime() - now2.getTime()) < 14 * 86_400_000;
          const isLifetime = plan === 'LIFETIME';

          if (isLifetime || (!isTrial && !isExpired && !isPremiumExpiringSoon)) return null;

          const trialDaysLeft = trialEnd ? Math.max(0, Math.floor((trialEnd.getTime() - now2.getTime()) / 86_400_000)) : null;
          const premiumDaysLeft = premiumEnd ? Math.max(0, Math.floor((premiumEnd.getTime() - now2.getTime()) / 86_400_000)) : null;

          const accentColor = isExpired ? '#ef4444' : '#7c3aed';
          const bgGrad = isExpired
            ? 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)'
            : 'linear-gradient(135deg, #1e1b4b 0%, #3b1278 60%, #4c1d95 100%)';

          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-4"
              style={{ background: bgGrad }}
            >
              {/* Decorative circle */}
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10 bg-white" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accentColor}30`, border: `1px solid ${accentColor}50` }}>
                  {isExpired ? <Zap className="w-5 h-5" style={{ color: accentColor }} /> : <Crown className="w-5 h-5 text-yellow-300" />}
                </div>

                <div className="flex-1 min-w-0">
                  {isExpired && (
                    <>
                      <p className="text-sm font-bold text-white">{t('subscription.expired')}</p>
                      <p className="text-xs text-red-300">{t('subscription.renewToKeep')}</p>
                    </>
                  )}
                  {isTrial && trialDaysLeft !== null && (
                    <>
                      <p className="text-sm font-bold text-white">
                        {trialDaysLeft === 0
                          ? t('subscription.trialEndsToday')
                          : t('subscription.daysLeftTrial', { count: trialDaysLeft })}
                      </p>
                      <p className="text-xs text-indigo-300">{t('subscription.upgradeAnytime')}</p>
                    </>
                  )}
                  {isPremiumExpiringSoon && premiumDaysLeft !== null && (
                    <>
                      <p className="text-sm font-bold text-white">
                        {t('subscription.premiumExpiresIn', { count: premiumDaysLeft })}
                      </p>
                      <p className="text-xs text-indigo-300">{t('subscription.renewToAvoid')}</p>
                    </>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPayment(true)}
                  className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: isExpired ? '#ef4444' : 'rgba(124,58,237,0.9)', border: `1px solid ${isExpired ? '#f87171' : '#a78bfa'}40` }}
                >
                  {isExpired ? t('subscription.renew') : t('subscription.upgrade')}
                </motion.button>
              </div>
            </motion.div>
          );
        })()}

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

        <div className="text-center pb-2 space-y-0.5">
          <p className="text-xs text-muted-foreground">{t('profile.version')}</p>
          <p className="text-[11px] text-muted-foreground/60">
            Built &amp; owned by <span className="text-muted-foreground font-semibold">Bun Kompheak</span>
          </p>
        </div>
      </div>

      <BottomNav />

      {/* Support modal */}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}

      {/* Payment / upgrade sheet */}
      <PaymentQRSheet isOpen={showPayment} onClose={() => setShowPayment(false)} />
    </div>
  );
}
