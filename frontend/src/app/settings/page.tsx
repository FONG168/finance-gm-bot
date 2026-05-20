'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Sun, Moon, Monitor, DollarSign, Clock,
  Bell, Globe, ChevronRight, Check,
} from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeMode } from '@/hooks/useTheme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotifSettings {
  weeklySummary: boolean;
  trialExpiration: boolean;
  premiumReminder: boolean;
  budgetAlerts: boolean;
}

const NOTIF_KEY = 'finance_gm_notifications';
const LANG_KEY = 'finance_gm_language';

function loadNotif(): NotifSettings {
  if (typeof window === 'undefined') return { weeklySummary: true, trialExpiration: true, premiumReminder: true, budgetAlerts: false };
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}'); } catch { return {} as NotifSettings; }
}

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
  { value: 'USD', label: 'US Dollar', sub: '$1,200.00' },
  { value: 'KHR', label: 'Cambodian Riel', sub: '៛4,800,000' },
  { value: 'THB', label: 'Thai Baht', sub: '฿4,500.00' },
];

const TIMEZONES = [
  { value: 'Asia/Phnom_Penh', label: 'Phnom Penh', sub: 'UTC+7' },
  { value: 'Asia/Bangkok', label: 'Bangkok', sub: 'UTC+7' },
  { value: 'Asia/Singapore', label: 'Singapore', sub: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo', sub: 'UTC+9' },
  { value: 'Europe/London', label: 'London', sub: 'UTC+0' },
  { value: 'America/New_York', label: 'New York', sub: 'UTC-5' },
  { value: 'UTC', label: 'UTC', sub: 'UTC+0' },
];

const THEME_OPTIONS = [
  { value: 'dark' as ThemeMode, label: 'Dark', sub: 'Always dark', icon: Moon },
  { value: 'light' as ThemeMode, label: 'Light', sub: 'Always light', icon: Sun },
  { value: 'system' as ThemeMode, label: 'System', sub: 'Follow device', icon: Monitor },
];

const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇬🇧', available: true },
  { value: 'km', label: 'ខ្មែរ (Khmer)', flag: '🇰🇭', available: false },
  { value: 'th', label: 'ภาษาไทย (Thai)', flag: '🇹🇭', available: false },
  { value: 'zh', label: '中文 (Chinese)', flag: '🇨🇳', available: false },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, updatePreferences } = useAuth();
  const { theme, setTheme } = useTheme();

  const [sheet, setSheet] = useState<'currency' | 'timezone' | 'theme' | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const [notif, setNotifState] = useState<NotifSettings>(() => {
    const saved = loadNotif();
    return {
      weeklySummary: saved.weeklySummary ?? true,
      trialExpiration: saved.trialExpiration ?? true,
      premiumReminder: saved.premiumReminder ?? true,
      budgetAlerts: saved.budgetAlerts ?? false,
    };
  });

  const currentCurrency = CURRENCIES.find(c => c.value === user?.currency) || CURRENCIES[0];
  const currentTimezone = TIMEZONES.find(t => t.value === user?.timezone) || TIMEZONES[0];
  const currentTheme = THEME_OPTIONS.find(t => t.value === theme) || THEME_OPTIONS[0];

  const handleCurrency = async (value: string) => {
    setSaving('currency');
    try { await updatePreferences({ currency: value }); } catch {}
    setSaving(null);
  };

  const handleTimezone = async (value: string) => {
    setSaving('timezone');
    try { await updatePreferences({ timezone: value }); } catch {}
    setSaving(null);
  };

  const handleNotif = (key: keyof NotifSettings, value: boolean) => {
    const next = { ...notif, [key]: value };
    setNotifState(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="px-4 max-w-2xl mx-auto space-y-5">

        {/* Appearance */}
        <div>
          <SectionHeader icon={Sun} title="Appearance" color="#f59e0b" />
          <SettingsCard>
            <button className="w-full" onClick={() => setSheet('theme')}>
              <SettingsRow
                icon={currentTheme.icon}
                iconColor="#f59e0b"
                label="Theme"
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
          <SectionHeader icon={DollarSign} title="Currency" color="#10b981" />
          <SettingsCard>
            <button className="w-full" onClick={() => setSheet('currency')}>
              <SettingsRow
                icon={DollarSign}
                iconColor="#10b981"
                label="Default Currency"
                sublabel={saving === 'currency' ? 'Saving...' : currentCurrency.sub}
                right={
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span className="text-xs font-semibold">{currentCurrency.value}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                }
              />
            </button>
          </SettingsCard>
        </div>

        {/* Timezone */}
        <div>
          <SectionHeader icon={Clock} title="Timezone" color="#6366f1" />
          <SettingsCard>
            <button className="w-full" onClick={() => setSheet('timezone')}>
              <SettingsRow
                icon={Clock}
                iconColor="#6366f1"
                label="Timezone"
                sublabel={saving === 'timezone' ? 'Saving...' : currentTimezone.sub}
                right={
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span className="text-xs">{currentTimezone.label}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                }
              />
            </button>
          </SettingsCard>
        </div>

        {/* Notifications */}
        <div>
          <SectionHeader icon={Bell} title="Notifications" color="#229ED9" />
          <SettingsCard>
            {([
              { key: 'weeklySummary', label: 'Weekly Summary', sub: 'Get your weekly finance report' },
              { key: 'trialExpiration', label: 'Trial Expiration', sub: 'Reminder before trial ends' },
              { key: 'premiumReminder', label: 'Premium Reminders', sub: 'Subscription renewal alerts' },
              { key: 'budgetAlerts', label: 'Budget Alerts', sub: 'Notify when nearing budget limit' },
            ] as { key: keyof NotifSettings; label: string; sub: string }[]).map(item => (
              <SettingsRow
                key={item.key}
                icon={Bell}
                iconColor="#229ED9"
                label={item.label}
                sublabel={item.sub}
                right={<Toggle checked={notif[item.key]} onChange={v => handleNotif(item.key, v)} />}
              />
            ))}
          </SettingsCard>
        </div>

        {/* Language */}
        <div>
          <SectionHeader icon={Globe} title="Language" color="#ec4899" />
          <SettingsCard>
            {LANGUAGES.map(lang => (
              <div key={lang.value} className="flex items-center gap-3 px-4 py-3.5 opacity-100">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                  {lang.flag}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{lang.label}</p>
                  {!lang.available && (
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  )}
                </div>
                {lang.available
                  ? <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  : <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">Soon</span>
                }
              </div>
            ))}
          </SettingsCard>
        </div>

        <div className="h-2" />
      </div>

      <BottomNav />

      {/* Option Sheets */}
      {sheet === 'theme' && (
        <OptionSheet
          title="Choose Theme"
          options={THEME_OPTIONS.map(t => ({ value: t.value, label: t.label, sub: t.sub }))}
          value={theme}
          onSelect={v => setTheme(v as ThemeMode)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'currency' && (
        <OptionSheet
          title="Choose Currency"
          options={CURRENCIES}
          value={user?.currency || 'USD'}
          onSelect={handleCurrency}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'timezone' && (
        <OptionSheet
          title="Choose Timezone"
          options={TIMEZONES}
          value={user?.timezone || 'UTC'}
          onSelect={handleTimezone}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
