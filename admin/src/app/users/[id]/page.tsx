'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatCurrency, PLAN_VARIANTS } from '@/lib/utils';
import {
  ArrowLeft, UserX, Ban, Star, Clock, Trash2, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, ShieldOff, Crown,
  CalendarX, CalendarCheck, Hourglass, TrendingUp, TimerOff,
} from 'lucide-react';
import Link from 'next/link';

// ── helpers ───────────────────────────────────────────────────────────────────

function daysFromNow(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.floor(diff / 86_400_000);
}

function pluralDays(n: number) {
  const abs = Math.abs(n);
  return `${abs} day${abs !== 1 ? 's' : ''}`;
}

interface SubStatus {
  label: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;        // tailwind color name for rings/borders
  bgStyle: React.CSSProperties;
  badgeVariant: string;
}

function getSubStatus(user: any): SubStatus {
  if (user.isBanned) return {
    label: 'Banned', description: 'Account is permanently banned',
    icon: <XCircle className="w-5 h-5" />,
    accentColor: 'red', bgStyle: { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' },
    badgeVariant: 'destructive',
  };
  if (user.isSuspended) return {
    label: 'Suspended', description: 'Account is temporarily suspended',
    icon: <ShieldOff className="w-5 h-5" />,
    accentColor: 'orange', bgStyle: { background: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.3)' },
    badgeVariant: 'orange',
  };
  if (user.plan === 'LIFETIME') return {
    label: 'Lifetime', description: 'Access never expires',
    icon: <Crown className="w-5 h-5" />,
    accentColor: 'purple', bgStyle: { background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.3)' },
    badgeVariant: 'purple',
  };
  if (user.plan === 'PREMIUM') {
    const days = daysFromNow(user.premiumExpiresAt);
    if (days !== null && days < 0) return {
      label: 'Premium Expired', description: `Expired ${pluralDays(days)} ago — access blocked`,
      icon: <CalendarX className="w-5 h-5" />,
      accentColor: 'red', bgStyle: { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' },
      badgeVariant: 'destructive',
    };
    if (days !== null && days <= 7) return {
      label: 'Expiring Soon', description: `Premium expires in ${pluralDays(days)}`,
      icon: <Hourglass className="w-5 h-5" />,
      accentColor: 'yellow', bgStyle: { background: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.3)' },
      badgeVariant: 'warning',
    };
    return {
      label: 'Premium Active', description: days !== null ? `${pluralDays(days)} remaining` : 'Active',
      icon: <CheckCircle className="w-5 h-5" />,
      accentColor: 'green', bgStyle: { background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)' },
      badgeVariant: 'success',
    };
  }
  // FREE plan
  if (user.subscriptionStatus === 'EXPIRED') return {
    label: 'Trial Expired', description: 'Free trial ended — recording blocked',
    icon: <CalendarX className="w-5 h-5" />,
    accentColor: 'red', bgStyle: { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' },
    badgeVariant: 'destructive',
  };
  if (user.subscriptionStatus === 'TRIAL') {
    const days = daysFromNow(user.trialEndsAt);
    return {
      label: 'Free Trial', description: days !== null && days > 0 ? `${pluralDays(days)} left in trial` : 'Trial active',
      icon: <CalendarCheck className="w-5 h-5" />,
      accentColor: 'blue', bgStyle: { background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.3)' },
      badgeVariant: 'blue',
    };
  }
  return {
    label: user.subscriptionStatus, description: '',
    icon: <CheckCircle className="w-5 h-5" />,
    accentColor: 'green', bgStyle: { background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)' },
    badgeVariant: 'success',
  };
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function UserDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const qc = useQueryClient();
  const [trialDays, setTrialDays] = useState(7);
  const [premiumDays, setPremiumDays] = useState(30);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminApi.users.get(id),
  });

  const user = data?.data?.data;

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-user', id] });

  const suspendM  = useMutation({ mutationFn: () => user?.isSuspended  ? adminApi.users.unsuspend(id) : adminApi.users.suspend(id),  onSuccess: invalidate });
  const banM      = useMutation({ mutationFn: () => user?.isBanned     ? adminApi.users.unban(id)     : adminApi.users.ban(id),      onSuccess: invalidate });
  const extendM   = useMutation({ mutationFn: () => adminApi.users.extendTrial(id, trialDays),                                        onSuccess: invalidate });
  const premiumM  = useMutation({ mutationFn: () => adminApi.users.activatePremium(id, premiumDays),                                  onSuccess: invalidate });
  const expireM   = useMutation({ mutationFn: () => adminApi.users.expire(id),                                                        onSuccess: invalidate });
  const downgradeM= useMutation({ mutationFn: () => adminApi.users.downgrade(id),                                                     onSuccess: invalidate });
  const deleteM   = useMutation({ mutationFn: () => adminApi.users.delete(id), onSuccess: () => router.replace('/users') });

  if (isLoading) {
    return (
      <div>
        <Header title="User Details" />
        <div className="p-6 flex justify-center pt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Header title="User Not Found" />
        <div className="p-6 text-center text-muted-foreground pt-20">User not found</div>
      </div>
    );
  }

  const sub = getSubStatus(user);
  const isBlocked = user.isBanned || user.isSuspended || user.subscriptionStatus === 'EXPIRED' || (user.plan === 'PREMIUM' && daysFromNow(user.premiumExpiresAt) !== null && daysFromNow(user.premiumExpiresAt)! < 0);

  const accentClasses: Record<string, string> = {
    red: 'text-red-400', orange: 'text-orange-400', green: 'text-emerald-400',
    blue: 'text-blue-400', yellow: 'text-yellow-400', purple: 'text-purple-400',
  };
  const accentText = accentClasses[sub.accentColor] || 'text-foreground';

  return (
    <div>
      <Header
        title={`${user.firstName} ${user.lastName || ''}`}
        description={`@${user.username || 'no-username'} · ID: ${user.telegramId}`}
      />

      <div className="p-6 space-y-5">
        <Link href="/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
          </Button>
        </Link>

        {/* ── Alert banner (only when action-needed) ── */}
        {isBlocked && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl border text-sm"
            style={sub.bgStyle}
          >
            <span className={`mt-0.5 flex-shrink-0 ${accentText}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <span className={`font-semibold ${accentText}`}>{sub.label} — </span>
              <span className="text-muted-foreground">{sub.description}</span>
              {(user.subscriptionStatus === 'EXPIRED' || (user.plan === 'PREMIUM' && daysFromNow(user.premiumExpiresAt) !== null && daysFromNow(user.premiumExpiresAt)! < 0)) && (
                <span className="text-muted-foreground"> Use <strong className="text-foreground">Activate Premium</strong> or <strong className="text-foreground">Extend Trial</strong> below to restore access.</span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Col 1: Profile + Status ── */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
                    {user.firstName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-muted-foreground">@{user.username || '—'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{user.telegramId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
                  {[
                    ['Currency', user.currency],
                    ['Timezone', user.timezone],
                    ['Language', user.languageCode || '—'],
                    ['Joined', formatDate(user.createdAt)],
                    ['Transactions', user._count?.transactions ?? 0],
                    ['Accounts', user._count?.accounts ?? 0],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{k}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Account flags */}
            <Card>
              <CardHeader><CardTitle>Account Flags</CardTitle></CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  { label: 'Account Active', value: !user.isBanned && !user.isSuspended, yes: 'Active', no: 'Inactive', yesV: 'success', noV: 'destructive' },
                  { label: 'Suspended',      value: user.isSuspended, yes: 'Yes',    no: 'No',     yesV: 'orange',      noV: 'gray' },
                  { label: 'Banned',         value: user.isBanned,    yes: 'Banned', no: 'No',     yesV: 'destructive', noV: 'gray' },
                ].map(({ label, value, yes, no, yesV, noV }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <Badge variant={(value ? yesV : noV) as any}>{value ? yes : no}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ── Col 2: Subscription ── */}
          <div className="space-y-4">

            {/* Status hero card */}
            <Card style={{ border: `1px solid`, ...sub.bgStyle }}>
              <CardContent className="pt-5">
                {/* Big status row */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: sub.bgStyle.background }}
                  >
                    <span className={accentText}>{sub.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-base font-bold ${accentText}`}>{sub.label}</span>
                      <Badge variant={(PLAN_VARIANTS[user.plan] || 'gray') as any} className="text-[10px]">{user.plan}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub.description}</p>
                  </div>
                </div>

                {/* ── Free Trial countdown ── */}
                {user.plan === 'FREE' && user.subscriptionStatus === 'TRIAL' && (() => {
                  const startDate = new Date(user.createdAt);
                  const endDate = user.trialEndsAt
                    ? new Date(user.trialEndsAt)
                    : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
                  const isEstimated = !user.trialEndsAt;
                  const totalMs = endDate.getTime() - startDate.getTime();
                  const elapsedMs = Date.now() - startDate.getTime();
                  const daysLeft = Math.max(0, Math.floor((endDate.getTime() - Date.now()) / 86_400_000));
                  const pct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)); // consumed %
                  const barColor = daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#eab308' : '#22c55e';
                  const textColor = daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-yellow-400' : 'text-emerald-400';
                  const totalDays = Math.round(totalMs / 86_400_000);
                  const usedDays = totalDays - daysLeft;
                  return (
                    <div className="mb-4 rounded-xl bg-secondary/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            Free Trial
                          </span>
                          {isEstimated && <span className="ml-1.5 text-[9px] text-blue-400 normal-case">estimated</span>}
                        </div>
                        <span className={`text-2xl font-black tabular-nums ${textColor}`}>
                          {daysLeft}
                          <span className="text-xs font-normal text-muted-foreground ml-1">days left</span>
                        </span>
                      </div>
                      {/* Progress bar — shows consumed portion */}
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Day {usedDays} of {totalDays} · Started {formatDate(user.createdAt)}</span>
                        <span>Ends {formatDate(endDate.toISOString())}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Premium countdown ── */}
                {(user.plan === 'PREMIUM' || user.plan === 'LIFETIME') && user.premiumStartedAt && user.premiumExpiresAt && (() => {
                  const startDate = new Date(user.premiumStartedAt);
                  const endDate = new Date(user.premiumExpiresAt);
                  const isLifetime = user.plan === 'LIFETIME';
                  const totalMs = endDate.getTime() - startDate.getTime();
                  const elapsedMs = Date.now() - startDate.getTime();
                  const daysLeft = isLifetime ? 9999 : Math.max(0, Math.floor((endDate.getTime() - Date.now()) / 86_400_000));
                  const pct = isLifetime ? 5 : Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
                  const barColor = daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#eab308' : '#a855f7';
                  const textColor = daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-yellow-400' : 'text-purple-400';
                  const totalDays = Math.round(totalMs / 86_400_000);
                  const usedDays = Math.min(totalDays, Math.floor(elapsedMs / 86_400_000));
                  return (
                    <div className="mb-4 rounded-xl bg-secondary/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          {isLifetime ? 'Lifetime Access' : 'Premium Plan'}
                        </span>
                        {isLifetime ? (
                          <span className="text-base font-black text-purple-400">∞ Forever</span>
                        ) : (
                          <span className={`text-2xl font-black tabular-nums ${textColor}`}>
                            {daysLeft}
                            <span className="text-xs font-normal text-muted-foreground ml-1">days left</span>
                          </span>
                        )}
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        {isLifetime ? (
                          <span>Activated {formatDate(user.premiumStartedAt)}</span>
                        ) : (
                          <>
                            <span>Day {usedDays} of {totalDays} · Upgraded {formatDate(user.premiumStartedAt)}</span>
                            <span>Expires {formatDate(user.premiumExpiresAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Date rows */}
                <div className="space-y-2 rounded-lg bg-secondary/60 p-3">
                  {[
                    {
                      label: 'Trial Ends',
                      value: user.trialEndsAt,
                      highlight: user.subscriptionStatus === 'TRIAL' && daysFromNow(user.trialEndsAt) !== null && daysFromNow(user.trialEndsAt)! <= 3,
                    },
                    { label: 'Premium Started', value: user.premiumStartedAt, highlight: false },
                    {
                      label: 'Premium Expires',
                      value: user.premiumExpiresAt,
                      highlight: user.plan === 'PREMIUM' && daysFromNow(user.premiumExpiresAt) !== null && daysFromNow(user.premiumExpiresAt)! <= 7,
                    },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={`font-medium tabular-nums ${highlight ? 'text-yellow-400' : 'text-foreground'}`}>
                        {value ? formatDate(value) : <span className="text-muted-foreground/50 italic text-xs">not set</span>}
                        {value && daysFromNow(value) !== null && (() => {
                          const d = daysFromNow(value)!;
                          if (d < 0) return <span className="ml-1.5 text-[10px] text-red-400 font-normal">({pluralDays(d)} ago)</span>;
                          if (d <= 7) return <span className="ml-1.5 text-[10px] text-yellow-400 font-normal">({pluralDays(d)} left)</span>;
                          return <span className="ml-1.5 text-[10px] text-emerald-400 font-normal">({pluralDays(d)} left)</span>;
                        })()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  Subscription Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">

                {/* Extend Trial row */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Extend Trial</p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" min={1} max={365} value={trialDays}
                        onChange={e => setTrialDays(Number(e.target.value))}
                        className="h-7 w-14 rounded-md border border-border bg-background px-2 text-sm text-foreground tabular-nums"
                      />
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => extendM.mutate()} loading={extendM.isPending} className="h-8 px-3 text-xs">
                    <Clock className="h-3 w-3 mr-1" /> Extend
                  </Button>
                </div>

                {/* Activate Premium row */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">
                      Activate Premium
                      {(user.subscriptionStatus === 'EXPIRED' || (user.plan === 'PREMIUM' && daysFromNow(user.premiumExpiresAt) !== null && daysFromNow(user.premiumExpiresAt)! < 0)) && (
                        <span className="ml-1.5 text-[10px] text-emerald-400 normal-case font-normal">(restores access)</span>
                      )}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" min={1} max={3650} value={premiumDays}
                        onChange={e => setPremiumDays(Number(e.target.value))}
                        className="h-7 w-14 rounded-md border border-border bg-background px-2 text-sm text-foreground tabular-nums"
                      />
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                  </div>
                  <Button variant="success" size="sm" onClick={() => premiumM.mutate()} loading={premiumM.isPending} className="h-8 px-3 text-xs">
                    <Star className="h-3 w-3 mr-1" /> Activate
                  </Button>
                </div>

                {/* Secondary actions — compact 2-col */}
                <div className="grid grid-cols-2 gap-2">
                  {user.subscriptionStatus !== 'EXPIRED' && (
                    <Button
                      variant="outline" size="sm"
                      className="border-orange-500/25 text-orange-400 hover:bg-orange-950 text-xs h-8"
                      onClick={() => expireM.mutate()} loading={expireM.isPending}
                    >
                      <TimerOff className="h-3 w-3 mr-1" />
                      Expire Now
                    </Button>
                  )}
                  <Button
                    variant="outline" size="sm"
                    className={`text-muted-foreground text-xs h-8 ${user.subscriptionStatus === 'EXPIRED' ? 'col-span-2' : ''}`}
                    onClick={() => downgradeM.mutate()} loading={downgradeM.isPending}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Downgrade
                  </Button>
                </div>

                {/* Danger Zone — inline */}
                <div className="pt-1 border-t border-border/60">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">Danger Zone</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline" size="sm"
                      className="border-orange-500/25 text-orange-400 hover:bg-orange-950/60 text-xs h-8"
                      onClick={() => suspendM.mutate()} loading={suspendM.isPending}
                    >
                      <UserX className="h-3 w-3 mr-1" />
                      {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      className="border-red-500/25 text-red-400 hover:bg-red-950/60 text-xs h-8"
                      onClick={() => banM.mutate()} loading={banM.isPending}
                    >
                      <Ban className="h-3 w-3 mr-1" />
                      {user.isBanned ? 'Unban' : 'Ban User'}
                    </Button>
                  </div>
                  <div className="mt-2">
                    {!confirmDelete ? (
                      <Button variant="destructive" size="sm" className="w-full text-xs h-8" onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete Account
                      </Button>
                    ) : (
                      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 space-y-2">
                        <p className="text-xs text-red-400 text-center font-semibold">⚠ This cannot be undone!</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                          <Button variant="destructive" size="sm" className="flex-1 text-xs h-7" onClick={() => deleteM.mutate()} loading={deleteM.isPending}>Confirm Delete</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* ── Col 3: Financial Summary ── */}
          <div className="space-y-4">
            {(() => {
              const txns = user.transactions || [];
              const totalIncome   = txns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0);
              const totalExpenses = txns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0);
              const totalBalance  = (user.accounts || []).reduce((s: number, a: any) => s + Number(a.balance), 0);
              const savings = totalIncome - totalExpenses;
              const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

              return (
                <>
                  {/* Net Worth */}
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Total Balance</p>
                      <p className={`text-3xl font-black tabular-nums ${totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(totalBalance, user.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">across {(user.accounts || []).length} account{(user.accounts || []).length !== 1 ? 's' : ''}</p>
                    </CardContent>
                  </Card>

                  {/* Income / Expenses */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Total Income</p>
                        <p className="text-xl font-black text-emerald-400 tabular-nums">+{formatCurrency(totalIncome, user.currency)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{txns.filter((t: any) => t.type === 'income').length} txns</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Total Expenses</p>
                        <p className="text-xl font-black text-red-400 tabular-nums">-{formatCurrency(totalExpenses, user.currency)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{txns.filter((t: any) => t.type === 'expense').length} txns</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Savings rate */}
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Net Saved</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${savingsRate >= 20 ? 'bg-emerald-500/15 text-emerald-400' : savingsRate >= 0 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                          {savingsRate}% rate
                        </span>
                      </div>
                      <p className={`text-xl font-black tabular-nums ${savings >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
                        {savings >= 0 ? '+' : ''}{formatCurrency(savings, user.currency)}
                      </p>
                      <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%`, backgroundColor: savingsRate >= 20 ? '#22c55e' : savingsRate >= 0 ? '#eab308' : '#ef4444' }} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account breakdown */}
                  {(user.accounts || []).length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Accounts</CardTitle></CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        {user.accounts.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{a.icon}</span>
                              <div>
                                <p className="text-sm font-medium text-foreground leading-none">{a.name}</p>
                                <p className="text-[10px] text-muted-foreground capitalize">{a.type}</p>
                              </div>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${Number(a.balance) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {formatCurrency(Number(a.balance), user.currency)}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
