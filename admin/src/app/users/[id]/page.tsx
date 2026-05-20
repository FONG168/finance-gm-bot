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
  return Math.ceil(diff / 86_400_000);
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
                      <Badge variant={PLAN_VARIANTS[user.plan] || 'gray'} className="text-[10px]">{user.plan}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub.description}</p>
                  </div>
                </div>

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
                        {value ? formatDate(value) : '—'}
                        {value && daysFromNow(value) !== null && (() => {
                          const d = daysFromNow(value)!;
                          if (d < 0) return <span className="ml-1.5 text-[10px] text-red-400 font-normal">({pluralDays(d)} ago)</span>;
                          if (d <= 7) return <span className="ml-1.5 text-[10px] text-yellow-400 font-normal">({pluralDays(d)} left)</span>;
                          return null;
                        })()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  Subscription Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Extend Trial */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Extend Trial
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number" min={1} max={365} value={trialDays}
                      onChange={e => setTrialDays(Number(e.target.value))}
                      className="h-9 w-20 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                    />
                    <span className="flex items-center text-xs text-muted-foreground">days</span>
                    <Button variant="outline" size="sm" onClick={() => extendM.mutate()} loading={extendM.isPending} className="ml-auto">
                      <Clock className="h-3.5 w-3.5 mr-1" /> Extend
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Activate Premium */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Activate Premium
                    {(user.subscriptionStatus === 'EXPIRED' || (user.plan === 'PREMIUM' && daysFromNow(user.premiumExpiresAt) !== null && daysFromNow(user.premiumExpiresAt)! < 0)) && (
                      <span className="ml-2 text-emerald-400 normal-case">(restores access)</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number" min={1} max={3650} value={premiumDays}
                      onChange={e => setPremiumDays(Number(e.target.value))}
                      className="h-9 w-20 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                    />
                    <span className="flex items-center text-xs text-muted-foreground">days</span>
                    <Button variant="success" size="sm" onClick={() => premiumM.mutate()} loading={premiumM.isPending} className="ml-auto">
                      <Star className="h-3.5 w-3.5 mr-1" /> Activate
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Expire now — only show when not already expired */}
                {user.subscriptionStatus !== 'EXPIRED' && (
                  <Button
                    variant="outline"
                    className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-950"
                    onClick={() => expireM.mutate()}
                    loading={expireM.isPending}
                  >
                    <TimerOff className="h-4 w-4 mr-1.5" />
                    Expire {user.plan === 'PREMIUM' ? 'Premium' : 'Trial'} Now
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full text-muted-foreground"
                  onClick={() => downgradeM.mutate()}
                  loading={downgradeM.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Downgrade to Free
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-500/20">
              <CardHeader><CardTitle className="text-red-400 text-sm">Danger Zone</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-950"
                  onClick={() => suspendM.mutate()}
                  loading={suspendM.isPending}
                >
                  <UserX className="h-4 w-4 mr-1.5" />
                  {user.isSuspended ? 'Unsuspend User' : 'Suspend User'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-950"
                  onClick={() => banM.mutate()}
                  loading={banM.isPending}
                >
                  <Ban className="h-4 w-4 mr-1.5" />
                  {user.isBanned ? 'Unban User' : 'Ban User'}
                </Button>
                {!confirmDelete ? (
                  <Button variant="destructive" className="w-full" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-4 w-4 mr-1.5" /> Delete Account
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-red-400 text-center font-medium">This cannot be undone!</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => deleteM.mutate()} loading={deleteM.isPending}>Confirm</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Col 3: Transactions ── */}
          <div>
            <Card className="h-full">
              <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {(user.transactions || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
                  ) : (
                    user.transactions.map((t: any) => (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.category?.label || t.category?.name}</p>
                          <p className="text-xs text-muted-foreground">{t.note || formatDate(t.date)}</p>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, user.currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
