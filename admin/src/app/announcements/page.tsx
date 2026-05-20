'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import { Plus, Megaphone, Trash2, Send } from 'lucide-react';

const TYPE_VARIANTS: Record<string, any> = {
  GLOBAL: 'blue', EXPIRATION_REMINDER: 'warning', MAINTENANCE: 'orange', PROMOTION: 'purple',
};

const CHANNEL_VARIANTS: Record<string, any> = {
  TELEGRAM: 'blue', IN_APP: 'gray', BOTH: 'success',
};

export default function AnnouncementsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'GLOBAL',
    channel: 'BOTH',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: () => adminApi.announcements.list(),
  });

  const announcements = data?.data?.data?.announcements ?? [];

  const createM = useMutation({
    mutationFn: () => adminApi.announcements.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      setShowForm(false);
      setForm({ title: '', message: '', type: 'GLOBAL', channel: 'BOTH' });
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => adminApi.announcements.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-announcements'] }),
  });

  return (
    <div>
      <Header title="Announcements" description="Send messages and notifications to users" />

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{announcements.length} announcements</p>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" /> New Announcement
          </Button>
        </div>

        {showForm && (
          <Card className="border-primary/30">
            <CardHeader><CardTitle>Create Announcement</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Title</label>
                <Input
                  placeholder="Announcement title"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Message</label>
                <textarea
                  className="w-full h-28 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="Write your announcement message here..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground mt-1"
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="EXPIRATION_REMINDER">Expiration Reminder</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="PROMOTION">Promotion</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Channel</label>
                  <select
                    value={form.channel}
                    onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                    className="w-full h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground mt-1"
                  >
                    <option value="BOTH">Both (Telegram + In-App)</option>
                    <option value="TELEGRAM">Telegram Only</option>
                    <option value="IN_APP">In-App Only</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button
                  onClick={() => createM.mutate()}
                  loading={createM.isPending}
                  disabled={!form.title || !form.message}
                >
                  <Send className="h-4 w-4 mr-1" /> Send Announcement
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-card rounded-xl border border-border animate-pulse" />
            ))
          ) : announcements.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No announcements yet</p>
            </div>
          ) : (
            announcements.map((a: any) => (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-foreground">{a.title}</p>
                        <Badge variant={TYPE_VARIANTS[a.type] || 'gray'}>{a.type.replace('_', ' ')}</Badge>
                        <Badge variant={CHANNEL_VARIANTS[a.channel] || 'gray'}>{a.channel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        By {a.createdBy?.firstName} · {formatDateTime(a.createdAt)}
                        {a.sentAt && ` · Sent: ${formatDateTime(a.sentAt)}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-400 flex-shrink-0"
                      onClick={() => deleteM.mutate(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
