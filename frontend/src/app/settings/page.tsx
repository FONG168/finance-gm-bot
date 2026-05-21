'use client';

import '@/lib/i18n';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Sun, Moon, Monitor, DollarSign,
  Globe, ChevronRight, Check,
} from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeMode } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/providers/I18nProvider';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
        {title}
      </span>
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border/50">
      {children}
    </div>
  );
}

function SettingsRow({ icon: Icon, iconColor, label, sublabel, right }: {
  icon: React.ElementType; iconColor: string; label: string; sublabel?: string; right: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}25` }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: checked ? '#7c3aed' : 'hsl(var(--secondary))' }}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function OptionSheet({ title, options, value, onSelect, onClose }: {
  title: string;
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full rounded-t-3xl bg-card border-t border-border p-4 pb-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
        <p className="text-sm font-semibold text-center mb-4">{title}</p>
        <div className="space-y-1">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt.value); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left"
              style={{ background: value === opt.value ? 'rgba(124,58,237,0.12)' : 'transparent' }}
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{opt.label}</p>
                {opt.sub && <p className="text-xs text-muted-foreground">{opt.sub}</p>}
              </div>
              {value === opt.value && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar', sub: '$1,250.00', flag: '🇺🇸' },
  { value: 'KHR', label: 'Cambodian Riel', sub: '៛5,000,000', flag: '🇰🇭' },
];


export default function SettingsPage() {
  const router = useRouter();
  const { user, updatePreferences } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation('common');
  const { language, changeLanguage } = useLanguage();

  const THEME_OPTIONS = [
    { value: 'dark' as ThemeMode, label: t('theme.dark'), sub: t('theme.darkDesc'), icon: Moon },
    { value: 'light' as ThemeMode, label: t('theme.light'), sub: t('theme.lightDesc'), icon: Sun },
    { value: 'system' as ThemeMode, label: t('theme.system'), sub: t('theme.systemDesc'), icon: Monitor },
  ];

  const [sheet, setSheet] = useState<'currency' | 'theme' | 'language' | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const currentCurrency = CURRENCIES.find(c => c.value === user?.currency) || CURRENCIES[0];
  const currentTheme = THEME_OPTIONS.find(t => t.value === theme) || THEME_OPTIONS[0];
  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleCurrency = async (value: string) => {
    setSaving('currency');
    try { await updatePreferences({ currency: value }); } catch {}
    setSaving(null);
  };

  const handleLanguage = async (value: string) => {
    setSaving('language');
    try { await changeLanguage(value); } catch {}
    setSaving(null);
  };

  return (
    <div className="min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">{t('settings.title')}</h1>
      </div>

      <div className="px-4 max-w-2xl mx-auto space-y-5">

        {/* Appearance */}
        <div>
          <SectionHeader icon={Sun} title={t('settings.appearance')} color="#f59e0b" />
          <SettingsCard>
            <button className="w-full" onClick={() => setSheet('theme')}>
              <SettingsRow
                icon={currentTheme.icon}
                iconColor="#f59e0b"
                label={t('settings.theme')}
                sublabel={currentTheme.sub}
                right={
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span className="text-xs">{currentTheme.label}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                }
              />
            </button>
          </SettingsCard>
        </div>

        {/* Currency */}
        <div>
          <SectionHeader icon={DollarSign} title={t('settings.currency')} color="#10b981" />
          <SettingsCard>
            <button className="w-full" onClick={() => setSheet('currency')}>
              <SettingsRow
                icon={DollarSign}
                iconColor="#10b981"
                label={t('settings.defaultCurrency')}
                sublabel={saving === 'currency' ? t('settings.saving') : currentCurrency.sub}
                right={
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-base">{(currentCurrency as any).flag}</span>
                    <span className="text-xs font-semibold">{currentCurrency.value}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                }
              />
            </button>
          </SettingsCard>
        </div>


        {/* Language */}
        <div>
          <SectionHeader icon={Globe} title={t('settings.language')} color="#ec4899" />
          <SettingsCard>
            <button className="w-full" onClick={() => setSheet('language')}>
              <SettingsRow
                icon={Globe}
                iconColor="#ec4899"
                label={t('settings.language')}
                sublabel={saving === 'language' ? t('settings.saving') : currentLanguage.nativeLabel}
                right={
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-base">{currentLanguage.flag}</span>
                    <span className="text-xs font-semibold">{currentLanguage.code.toUpperCase()}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                }
              />
            </button>
          </SettingsCard>
        </div>

        <div className="h-2" />
      </div>

      <BottomNav />

      {/* Option Sheets */}
      {sheet === 'theme' && (
        <OptionSheet
          title={t('settings.chooseTheme')}
          options={THEME_OPTIONS.map(t => ({ value: t.value, label: t.label, sub: t.sub }))}
          value={theme}
          onSelect={v => setTheme(v as ThemeMode)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'currency' && (
        <OptionSheet
          title={t('settings.chooseCurrency')}
          options={CURRENCIES.map(c => ({ value: c.value, label: `${c.flag}  ${c.value} — ${c.label}`, sub: c.sub }))}
          value={user?.currency || 'USD'}
          onSelect={handleCurrency}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'language' && (
        <OptionSheet
          title={t('settings.chooseLanguage')}
          options={SUPPORTED_LANGUAGES.map(l => ({ value: l.code, label: `${l.flag}  ${l.nativeLabel}`, sub: l.label }))}
          value={language}
          onSelect={handleLanguage}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
