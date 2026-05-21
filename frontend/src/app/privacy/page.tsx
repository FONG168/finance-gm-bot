'use client';

import '@/lib/i18n';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Smartphone, Copy, Check, Lock, Shield } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

function SectionHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
    </div>
  );
}

function InfoRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center justify-between px-4 py-3.5 gap-3">
      <p className="text-xs text-muted-foreground flex-shrink-0">{label}</p>
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-sm font-medium truncate text-right">{value}</p>
        {copyable && (
          <button onClick={copy} className="flex-shrink-0 w-6 h-6 rounded-lg bg-secondary flex items-center justify-center">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation('common');

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">{t('privacy.title')}</h1>
      </div>

      <div className="px-4 max-w-2xl mx-auto space-y-5">

        {/* Account Info */}
        <div>
          <SectionHeader icon={User} title={t('privacy.telegramAccount')} color="#229ED9" />
          <div className="rounded-2xl bg-card border border-border divide-y divide-border/50">
            <InfoRow label={t('privacy.name')} value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '—'} />
            {user?.username && <InfoRow label={t('privacy.username')} value={`@${user.username}`} copyable />}
            <InfoRow label={t('privacy.telegramId')} value={user?.telegramId ? String(user.telegramId) : '—'} copyable />
            <InfoRow label={t('privacy.accountLinked')} value="✓ Telegram" />
          </div>
        </div>

        {/* Session */}
        <div>
          <SectionHeader icon={Smartphone} title={t('privacy.session')} color="#6366f1" />
          <div className="rounded-2xl bg-card border border-border divide-y divide-border/50">
            <InfoRow label={t('privacy.status')} value={t('privacy.active')} />
            <InfoRow label={t('privacy.platform')} value="Telegram Mini App" />
            <InfoRow label={t('privacy.memberSince')} value={memberSince} />
          </div>
        </div>

        {/* Security Info */}
        <div>
          <SectionHeader icon={Lock} title={t('privacy.security')} color="#10b981" />
          <div className="rounded-2xl bg-card border border-border divide-y divide-border/50">
            <InfoRow label={t('privacy.authentication')} value={t('privacy.telegramAuth')} />
            <InfoRow label={t('privacy.dataEncryption')} value={t('privacy.endToEnd')} />
          </div>
        </div>

        {/* Privacy note */}
        <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium mb-0.5">{t('privacy.yourPrivacy')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('privacy.privacyText')}
            </p>
          </div>
        </div>

        <div className="h-2" />
      </div>

      <BottomNav />
    </div>
  );
}
