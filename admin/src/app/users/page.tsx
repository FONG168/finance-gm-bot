'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatRelative, PLAN_COLORS, STATUS_COLORS } from '@/lib/utils';
import { Search, UserX, Ban, Star, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const PLAN_VARIANTS: Record<string, any> = {
  PREMIUM: 'warning', LIFETIME: 'purple', FREE: 'gray',
};
const STATUS_VARIANTS: Record<string, any> = {
  ACTIVE: 'success', TRIAL: 'blue', EXPIRED: 'destructive', SUSPENDED: 'orange', CANCELLED: 'gray',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch, plan, status, page],
    queryFn: () => adminApi.users.list({ search: debouncedSearch, plan, status, page, limit: 20 }),
  });

  const users = data?.data?.data?.users ?? [];
  const pagination = data?.data?.data?.pagination;

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as any)._searchTimer);
    (window as any)._searchTimer = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 400);
  };

  const suspendMutation = useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      suspended ? adminApi.users.unsuspend(id) : adminApi.users.suspend(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div>
      <Header title="Users" description="Manage platform users" />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={plan}
            onChange={e => { setPlan(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
          >
            <option value="">All Plans</option>
            <option value="FREE">Free</option>
            <option value="PREMIUM">Premium</option>
            <option value="LIFETIME">Lifetime</option>
          </select>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
          >
            <option value="">All Statuses</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['User', 'Telegram ID', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse w-24" /></td>
                        ))}
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No users found</td>
                    </tr>
                  ) : (
                    users.map((u: any) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {u.firstName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-muted-foreground">@{u.username || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.telegramId}</td>
                        <td className="px-4 py-3">
                          <Badge variant={PLAN_VARIANTS[u.plan] || 'gray'}>{u.plan}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge variant={STATUS_VARIANTS[u.subscriptionStatus] || 'gray'}>
                              {u.subscriptionStatus}
                            </Badge>
                            {u.isBanned && <Badge variant="destructive">BANNED</Badge>}
                            {u.isSuspended && <Badge variant="orange">SUSPENDED</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatRelative(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link href={`/users/${u.id}`}>
                              <Button variant="ghost" size="icon" title="View detail">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              title={u.isSuspended ? 'Unsuspend' : 'Suspend'}
                              onClick={() => suspendMutation.mutate({ id: u.id, suspended: u.isSuspended })}
                              className={u.isSuspended ? 'text-green-400 hover:text-green-300' : 'text-orange-400 hover:text-orange-300'}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total} users
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
