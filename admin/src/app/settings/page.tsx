'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toaster';
import { ROLE_COLORS, formatDateTime, PERMISSIONS } from '@/lib/utils';
import { Shield, Plus, Edit, Users, CreditCard } from 'lucide-react';

interface SubPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  days: number;
  popular?: boolean;
  description?: string;
}

export default function SettingsPage() {
  const { admin } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editingPerms, setEditingPerms] = useState<string | null>(null);
  const [permsForm, setPermsForm] = useState<{ role: string; permissions: string[] }>({ role: '', permissions: [] });
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', firstName: '', role: 'SUPPORT_AGENT' });
  const [showNewAdmin, setShowNewAdmin] = useState(false);

  const [plans, setPlans] = useState<SubPlan[]>([
    { id: '1_month', name: '1 Month', price: 2.99, currency: 'USD', days: 30, popular: true, description: '30 days unlimited access' }
  ]);

  const { data: settingsData } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => adminApi.settings.get(),
  });

  useEffect(() => {
    const list = settingsData?.data?.data || [];
    const planSetting = list.find((s: any) => s.key === 'subscription_plans');
    if (planSetting && Array.isArray(planSetting.value) && planSetting.value.length > 0) {
      setPlans(planSetting.value);
    }
  }, [settingsData]);

  const updatePlansM = useMutation({
    mutationFn: () => adminApi.settings.update('subscription_plans', plans),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-settings'] });
      toast({ title: 'Plan Settings Saved', description: 'Subscription plans and prices updated successfully.', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Save Failed', description: 'Could not update subscription plan settings.', variant: 'destructive' });
    }
  });

  const { data: adminsData, isLoading } = useQuery({
    queryKey: ['admin-list'],
    queryFn: () => adminApi.settings.listAdmins(),
    enabled: admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN',
  });

  const admins = adminsData?.data?.data ?? [];

  const createAdminM = useMutation({
    mutationFn: () => adminApi.auth.createAdmin(newAdmin),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-list'] }); setShowNewAdmin(false); },
  });

  const updatePermsM = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      adminApi.settings.updateAdminPermissions(id, { role: permsForm.role, permissions: permsForm.permissions }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-list'] }); setEditingPerms(null); },
  });

  const startEdit = (a: any) => {
    setPermsForm({ role: a.role, permissions: a.permissions });
    setEditingPerms(a.id);
  };

  const togglePermission = (perm: string) => {
    setPermsForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  return (
    <div>
      <Header title="Settings" description="Admin users and system configuration" />

      <div className="p-6 space-y-6">
        {/* Admin Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Admin Users</CardTitle>
                <CardDescription>Manage admin accounts and permissions</CardDescription>
              </div>
              {(admin?.role === 'SUPER_ADMIN') && (
                <Button size="sm" onClick={() => setShowNewAdmin(!showNewAdmin)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Admin
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showNewAdmin && (
              <div className="rounded-lg border border-primary/30 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">New Admin</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground">First Name</label>
                    <Input value={newAdmin.firstName} onChange={e => setNewAdmin(f => ({ ...f, firstName: e.target.value }))} /></div>
                  <div><label className="text-xs text-muted-foreground">Email</label>
                    <Input type="email" value={newAdmin.email} onChange={e => setNewAdmin(f => ({ ...f, email: e.target.value }))} /></div>
                  <div><label className="text-xs text-muted-foreground">Password</label>
                    <Input type="password" value={newAdmin.password} onChange={e => setNewAdmin(f => ({ ...f, password: e.target.value }))} /></div>
                  <div><label className="text-xs text-muted-foreground">Role</label>
                    <select value={newAdmin.role} onChange={e => setNewAdmin(f => ({ ...f, role: e.target.value }))}
                      className="w-full h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground mt-0">
                      <option value="SUPPORT_AGENT">Support Agent</option>
                      <option value="MODERATOR">Moderator</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowNewAdmin(false)}>Cancel</Button>
                  <Button size="sm" onClick={() => createAdminM.mutate()} loading={createAdminM.isPending}>Create Admin</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {isLoading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-secondary rounded-lg animate-pulse" />)
              ) : admins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No admins found</p>
              ) : (
                admins.map((a: any) => (
                  <div key={a.id} className="rounded-lg border border-border p-4">
                    {editingPerms === a.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{a.firstName} — {a.email}</p>
                          <select
                            value={permsForm.role}
                            onChange={e => setPermsForm(f => ({ ...f, role: e.target.value }))}
                            className="h-8 rounded-md border border-border bg-secondary px-2 text-xs text-foreground"
                          >
                            <option value="SUPPORT_AGENT">Support Agent</option>
                            <option value="MODERATOR">Moderator</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Permissions</p>
                          <div className="flex flex-wrap gap-2">
                            {PERMISSIONS.map(perm => (
                              <button
                                key={perm}
                                onClick={() => togglePermission(perm)}
                                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                                  permsForm.permissions.includes(perm)
                                    ? 'bg-primary/20 border-primary/50 text-primary'
                                    : 'border-border text-muted-foreground hover:border-primary/30'
                                }`}
                              >
                                {perm}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setEditingPerms(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => updatePermsM.mutate({ id: a.id })} loading={updatePermsM.isPending}>Save</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          {a.firstName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{a.firstName} {a.lastName}</p>
                            <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[a.role] || ''}`}>
                              {a.role.replace('_', ' ')}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{a.email}</p>
                          {a.permissions.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Permissions: {a.permissions.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {!a.isActive && <Badge variant="destructive">Inactive</Badge>}
                          {admin?.role === 'SUPER_ADMIN' && a.id !== admin.id && (
                            <Button variant="ghost" size="icon" onClick={() => startEdit(a)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plan Configurator */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Subscription Plan Pricing & Duration
                </CardTitle>
                <CardDescription>Configure premium plan prices and durations displayed in the Telegram Mini App</CardDescription>
              </div>
              <Button size="sm" onClick={() => updatePlansM.mutate()} loading={updatePlansM.isPending}>
                Save Plan Settings
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p, idx) => (
                <div key={p.id || idx} className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Plan #{idx + 1}</span>
                    <Badge variant={p.popular ? 'success' : 'gray'}>
                      {p.popular ? 'Featured' : 'Standard'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Plan Title</label>
                    <Input
                      value={p.name}
                      onChange={e => {
                        const val = e.target.value;
                        setPlans(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                      }}
                      placeholder="e.g. 1 Month"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Price ($ USD)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={p.price}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setPlans(prev => prev.map((item, i) => i === idx ? { ...item, price: val } : item));
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Duration (Days)</label>
                      <Input
                        type="number"
                        value={p.days}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 1;
                          setPlans(prev => prev.map((item, i) => i === idx ? { ...item, days: val } : item));
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Description</label>
                    <Input
                      value={p.description || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setPlans(prev => prev.map((item, i) => i === idx ? { ...item, description: val } : item));
                      }}
                      placeholder="e.g. 30 days full premium access"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Your Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground">{admin?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[admin?.role || ''] || ''}`}>
                  {admin?.role?.replace('_', ' ')}
                </div>
              </div>
              {admin?.role !== 'SUPER_ADMIN' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Permissions</span>
                  <span className="text-foreground text-right max-w-xs">
                    {admin?.permissions?.join(', ') || '—'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
