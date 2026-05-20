'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, TrendingUp, Users, Star } from 'lucide-react';

const COLORS = ['hsl(142,71%,45%)', 'hsl(210,100%,56%)', 'hsl(45,93%,47%)', 'hsl(280,67%,50%)'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {typeof p.value === 'number' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function RevenuePage() {
  const { data: statsRes, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.dashboard.stats(),
  });

  const stats = statsRes?.data?.data;

  const planData = stats ? [
    { name: 'Free', value: stats.users.total - stats.users.premium },
    { name: 'Premium', value: stats.users.premium },
    { name: 'Trial', value: stats.users.trial },
  ] : [];

  return (
    <div>
      <Header title="Revenue" description="Financial analytics and revenue tracking" />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: formatCurrency(stats?.revenue?.total ?? 0), icon: DollarSign, color: 'text-green-400' },
            { label: 'This Month', value: formatCurrency(stats?.revenue?.thisMonth ?? 0), icon: TrendingUp, color: 'text-blue-400' },
            { label: 'Premium Users', value: stats?.users?.premium ?? 0, icon: Star, color: 'text-yellow-400' },
            { label: 'Total Users', value: stats?.users?.total ?? 0, icon: Users, color: 'text-primary' },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {isLoading ? '…' : item.value}
                    </p>
                  </div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Over Time */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Revenue Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats?.charts?.monthlyRevenue ?? []}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(142,71%,45%)" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Plan Distribution */}
          <Card>
            <CardHeader><CardTitle>Plan Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={planData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {planData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={v => <span className="text-xs text-muted-foreground">{v}</span>}
                  />
                  <Tooltip formatter={(v: any) => [v, 'Users']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* User Growth */}
        <Card>
          <CardHeader><CardTitle>New Users Per Month</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.charts?.monthlyGrowth ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="users" fill="hsl(210,100%,56%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
