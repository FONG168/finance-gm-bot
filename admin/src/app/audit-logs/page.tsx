'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, ROLE_COLORS } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  'user.suspend': 'orange',
  'user.ban': 'destructive',
  'user.delete': 'destructive',
  'user.unban': 'success',
  'user.unsuspend': 'success',
  'payment.approve': 'success',
  'payment.reject': 'destructive',
  'subscription.activate': 'warning',
  'subscription.extend_trial': 'blue',
  'admin.login': 'gray',
  'qrcode.update': 'blue',
  'announcement.create': 'purple',
};

export default function AuditLogsPage() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedAction, setDebouncedAction] = useState('');

  const handleSearch = (v: string) => {
    setAction(v);
    clearTimeout((window as any)._auditTimer);
    (window as any)._auditTimer = setTimeout(() => { setDebouncedAction(v); setPage(1); }, 400);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', debouncedAction, page],
    queryFn: () => adminApi.auditLogs.list({ action: debouncedAction || undefined, page, limit: 50 }),
  });

  const logs = data?.data?.data?.logs ?? [];
  const pagination = data?.data?.data?.pagination;

  return (
    <div>
      <Header title="Audit Logs" description="Track all admin actions and system changes" />

      <div className="p-6 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by action (e.g. user.ban)…"
              value={action}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Time', 'Admin', 'Action', 'Target', 'Details'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(10)].map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {[...Array(5)].map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse w-28" /></td>
                        ))}
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <ScrollText className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                        <p className="text-muted-foreground">No audit logs found</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log: any) => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-foreground">{log.admin?.firstName}</p>
                            <p className="text-xs text-muted-foreground">{log.admin?.role}</p>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={(ACTION_COLORS[log.action] as any) || 'gray'}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {log.targetUser ? (
                            <div>
                              <p className="text-sm text-foreground">{log.targetUser.firstName}</p>
                              <p className="text-xs text-muted-foreground">@{log.targetUser.username || '—'}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">{log.targetType} · {log.targetId?.slice(0, 8)}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 max-w-xs">
                          {log.newValue && (
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {JSON.stringify(log.newValue)}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {pagination.totalPages} · {pagination.total} logs
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
