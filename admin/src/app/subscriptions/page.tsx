'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatRelative } from '@/lib/utils';
import { Star, Clock, AlertCircle, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const STATUS_TABS = [
  { label: 'Trial', value: 'TRIAL', icon: Clock, color: 'text-blue-400' },
  { label: 'Active', value: 'ACTIVE', icon: Star, color: 'text-yellow-400' },
  { label: 'Expired', value: 'EXPIRED', icon: AlertCircle, color: 'text-red-400' },
  { label: 'All', value: '', icon: Users, color: 'text-muted-foreground' },
];

export default function SubscriptionsPage() {
  const [status, setStatus] = useState('TRIAL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', status, page],
    queryFn: () => adminApi.users.list({ status: status || undefined, page, limit: 30 }),
  });

  const users = data?.data?.data?.users ?? [];
  const pagination = data?.data?.data?.pagination;

  return (
    <div>
      <Header title="Subscriptions" description="Manage user subscription plans and status" />

      <div className="p-6 space-y-4">
        {/* Status Tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                status === tab.value
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <tab.icon className={`h-4 w-4 ${tab.color}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['User', 'Plan', 'Status', 'Trial Ends', 'Premium Expires', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse w-24" /></td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No users in this status</td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {u.firstName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground">@{u.username || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.plan === 'PREMIUM' ? 'warning' : u.plan === 'LIFETIME' ? 'purple' : 'gray'}>
                          {u.plan}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          u.subscriptionStatus === 'ACTIVE' ? 'success' :
                          u.subscriptionStatus === 'TRIAL' ? 'blue' : 'destructive'
                        }>
                          {u.subscriptionStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.trialEndsAt)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.premiumExpiresAt)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelative(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/users/${u.id}`}>
                          <Button variant="ghost" size="sm">Manage</Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {pagination.total} users
                </p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
