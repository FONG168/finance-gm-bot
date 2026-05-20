'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatRelative } from '@/lib/utils';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, ImageIcon, X } from 'lucide-react';

const STATUS_VARIANTS: Record<string, any> = {
  PENDING: 'warning', APPROVED: 'success', REJECTED: 'destructive', CANCELLED: 'gray',
};

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', status, page],
    queryFn: () => adminApi.payments.list({ status: status || undefined, page, limit: 20 }),
    refetchInterval: 30_000,
  });

  const payments = data?.data?.data?.payments ?? [];
  const pagination = data?.data?.data?.pagination;

  const approveM = useMutation({
    mutationFn: (id: string) => adminApi.payments.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payments'] }),
  });
  const rejectM = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.payments.reject(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-payments'] }); setRejectOpen(null); },
  });

  return (
    <div>
      <Header title="Payments" description="Review and approve payment requests" />

      <div className="p-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', ''].map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                status === s ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['User', 'Amount', 'Plan', 'Duration', 'QR', 'Receipt', 'Status', 'Submitted', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {[...Array(9)].map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No payments found</td>
                    </tr>
                  ) : (
                    payments.map((p: any) => (
                      <>
                        <tr key={p.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-foreground">{p.user?.firstName} {p.user?.lastName}</p>
                              <p className="text-xs text-muted-foreground">@{p.user?.username || '—'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">{formatCurrency(p.amount, p.currency)}</td>
                          <td className="px-4 py-3"><Badge variant={p.plan === 'PREMIUM' ? 'warning' : 'purple'}>{p.plan}</Badge></td>
                          <td className="px-4 py-3 text-muted-foreground">{p.durationDays}d</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.qrProvider || '—'}</td>
                          <td className="px-4 py-3">
                            {p.screenshotUrl ? (
                              <button
                                onClick={() => setReceiptImage(p.screenshotUrl)}
                                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                              >
                                <img
                                  src={p.screenshotUrl}
                                  alt="receipt"
                                  className="w-8 h-8 rounded object-cover border border-border"
                                />
                                View
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3"><Badge variant={STATUS_VARIANTS[p.status] || 'gray'}>{p.status}</Badge></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelative(p.createdAt)}</td>
                          <td className="px-4 py-3">
                            {p.status === 'PENDING' && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => approveM.mutate(p.id)}
                                  loading={approveM.isPending}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setRejectOpen(rejectOpen === p.id ? null : p.id)}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                              </div>
                            )}
                            {p.status !== 'PENDING' && p.reviewedBy && (
                              <p className="text-xs text-muted-foreground">by {p.reviewedBy.firstName}</p>
                            )}
                          </td>
                        </tr>
                        {rejectOpen === p.id && (
                          <tr className="border-b border-border/50 bg-red-950/20">
                            <td colSpan={9} className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <input
                                  placeholder="Rejection reason…"
                                  value={rejectReason[p.id] || ''}
                                  onChange={e => setRejectReason(prev => ({ ...prev, [p.id]: e.target.value }))}
                                  className="flex-1 h-9 rounded-md border border-border bg-secondary px-3 text-sm"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => rejectM.mutate({ id: p.id, reason: rejectReason[p.id] || '' })}
                                  loading={rejectM.isPending}
                                >
                                  Confirm Reject
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setRejectOpen(null)}>Cancel</Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {pagination.totalPages} · {pagination.total} payments
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

      {/* Receipt lightbox */}
      {receiptImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setReceiptImage(null)}
        >
          <div className="relative max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setReceiptImage(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white flex items-center gap-1.5 text-sm"
            >
              <X className="h-4 w-4" /> Close
            </button>
            <div className="bg-card rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Payment Receipt</span>
              </div>
              <div className="p-2 bg-black/20 flex items-center justify-center min-h-[200px]">
                <img
                  src={receiptImage}
                  alt="Payment receipt"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
