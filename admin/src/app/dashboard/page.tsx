'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatRelative } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, Star, CreditCard, TrendingUp, UserX, Clock, AlertCircle, DollarSign,
} from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  href?: string;
}

function StatCard({ title, value, sub, icon: Icon, color = 'text-primary', href }: StatCardProps) {
  const inner = (
    <Card className="hover:border-primary/30 transition-colors cursor-pointer">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' && p.name === 'revenue' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.dashboard.stats(),
    refetchInterval: 60_000,
  });
  const { data: activityRes, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => adminApi.dashboard.recentActivity(),
  });

  const stats = statsRes?.data?.data;
  const activity = activityRes?.data?.data;

  return (
    <div>
      <Header title="Dashboard" description="Platform overview and key metrics" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users" value={statsLoading ? '…' : stats?.users?.total ?? 0}
            sub={`+${stats?.users?.newThisMonth ?? 0} this month`}
            icon={Users} href="/users"
          />
          <StatCard
            title="Premium Users" value={statsLoading ? '…' : stats?.users?.premium ?? 0}
            sub="Active subscriptions"
            icon={Star} color="text-yellow-400" href="/subscriptions"
          />
          <StatCard
            title="Revenue (month)" value={statsLoading ? '…' : formatCurrency(stats?.revenue?.thisMonth ?? 0)}
            sub={`Total: ${formatCurrency(stats?.revenue?.total ?? 0)}`}
            icon={DollarSign} color="text-green-400" href="/revenue"
          />
          <StatCard
            title="Pending Payments" value={statsLoading ? '…' : stats?.payments?.pending ?? 0}
            sub="Awaiting review"
            icon={CreditCard} color="text-orange-400" href="/payments"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Trial Users" value={stats?.users?.trial ?? 0} icon={Clock} color="text-blue-400" />
          <StatCard title="Expired Users" value={stats?.users?.expired ?? 0} icon={AlertCircle} color="text-red-400" />
          <StatCard title="Suspended" value={stats?.users?.suspended ?? 0} icon={UserX} color="text-orange-400" />
          <StatCard title="Active Users" value={stats?.users?.active ?? 0} icon={TrendingUp} color="text-green-400" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats?.charts?.monthlyGrowth ?? []}>
                  <defs>
                    <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(210,100%,56%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(210,100%,56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="users" name="users" stroke="hsl(210,100%,56%)" fill="url(#ug)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.charts?.monthlyRevenue ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="revenue" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Signups</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-secondary rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(activity?.recentUsers ?? []).map((u: any) => (
                    <Link key={u.id} href={`/users/${u.id}`} className="flex items-center gap-3 hover:bg-accent p-2 -mx-2 rounded-lg transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {u.firstName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-muted-foreground">@{u.username || 'no-username'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={u.plan === 'PREMIUM' ? 'warning' : 'gray'} className="text-xs">{u.plan}</Badge>
                        <p className="text-xs text-muted-foreground">{formatRelative(u.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-secondary rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(activity?.recentPayments ?? []).map((p: any) => (
                    <Link key={p.id} href="/payments" className="flex items-center gap-3 hover:bg-accent p-2 -mx-2 rounded-lg transition-colors">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{p.user?.firstName}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(p.amount, p.currency)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={p.status === 'PENDING' ? 'warning' : p.status === 'APPROVED' ? 'success' : 'destructive'}
                          className="text-xs"
                        >
                          {p.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{formatRelative(p.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                  {!(activity?.recentPayments?.length) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
