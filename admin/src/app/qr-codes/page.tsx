'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { QrCode, Plus, Trash2, Edit, Upload, Link, X } from 'lucide-react';

const PROVIDERS = ['ABA', 'ACLEDA', 'WING', 'KHQR'];

interface QRForm {
  imageUrl: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
}

export default function QRCodesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<QRForm>({ imageUrl: '', accountName: '', accountNumber: '', instructions: '' });
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, imageUrl: ev.target?.result as string }));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-qr-codes'],
    queryFn: () => adminApi.qrCodes.list(),
  });

  const qrCodes = data?.data?.data ?? [];

  const updateM = useMutation({
    mutationFn: ({ provider, data }: { provider: string; data: QRForm }) =>
      adminApi.qrCodes.update(provider, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-qr-codes'] }); setEditing(null); },
  });

  const deleteM = useMutation({
    mutationFn: (provider: string) => adminApi.qrCodes.delete(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-qr-codes'] }),
  });

  const startEdit = (provider: string) => {
    const existing = qrCodes.find((q: any) => q.provider === provider);
    setForm({
      imageUrl: existing?.imageUrl || '',
      accountName: existing?.accountName || '',
      accountNumber: existing?.accountNumber || '',
      instructions: existing?.instructions || '',
    });
    setUploadMode(existing?.imageUrl?.startsWith('data:') || !existing ? 'file' : 'url');
    setEditing(provider);
  };

  return (
    <div>
      <Header title="QR Codes" description="Manage payment QR codes displayed to users" />

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROVIDERS.map(provider => {
            const qr = qrCodes.find((q: any) => q.provider === provider);
            return (
              <Card key={provider}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-primary" />
                      {provider}
                    </CardTitle>
                    <div className="flex gap-2">
                      {qr && (
                        <Badge variant={qr.isActive ? 'success' : 'gray'}>
                          {qr.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => startEdit(provider)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {qr && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => deleteM.mutate(provider)}
                          loading={deleteM.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editing === provider ? (
                    <div className="space-y-3">
                      {/* Image upload section */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs text-muted-foreground">QR Code Image</label>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setUploadMode('file')}
                              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md transition-colors ${uploadMode === 'file' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              <Upload className="h-3 w-3" /> Upload
                            </button>
                            <button
                              onClick={() => setUploadMode('url')}
                              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md transition-colors ${uploadMode === 'url' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              <Link className="h-3 w-3" /> URL
                            </button>
                          </div>
                        </div>

                        {uploadMode === 'file' ? (
                          <div>
                            <input
                              ref={fileRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                            {form.imageUrl && form.imageUrl.startsWith('data:') ? (
                              <div className="relative w-full flex flex-col items-center gap-2">
                                <div className="bg-white rounded-xl p-2 w-40 h-40 flex items-center justify-center">
                                  <img src={form.imageUrl} alt="QR preview" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                                    <Upload className="h-3.5 w-3.5 mr-1" /> Change
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400"
                                    onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                                  >
                                    <X className="h-3.5 w-3.5 mr-1" /> Remove
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
                              >
                                {uploading ? (
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                ) : (
                                  <>
                                    <Upload className="h-6 w-6" />
                                    <span className="text-sm font-medium">Click to upload QR image</span>
                                    <span className="text-xs">PNG, JPG, WEBP supported</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <Input
                            placeholder="https://..."
                            value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                            onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Account Name</label>
                          <Input value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Account Number</label>
                          <Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Instructions</label>
                        <textarea
                          className="w-full h-20 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground resize-none"
                          value={form.instructions}
                          onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                          placeholder="Payment instructions..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => updateM.mutate({ provider, data: form })}
                          loading={updateM.isPending}
                        >
                          Save QR Code
                        </Button>
                        <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : qr ? (
                    <div className="space-y-3">
                      <div className="flex gap-4 items-start">
                        <div className="w-24 h-24 rounded-lg border border-border overflow-hidden bg-white flex-shrink-0">
                          <img src={qr.imageUrl} alt={`${provider} QR`} className="w-full h-full object-contain" />
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Name: </span>{qr.accountName || '—'}</p>
                          <p><span className="text-muted-foreground">Number: </span>{qr.accountNumber || '—'}</p>
                          {qr.instructions && (
                            <p className="text-xs text-muted-foreground">{qr.instructions}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <QrCode className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No QR code uploaded</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => startEdit(provider)}>
                        <Plus className="h-4 w-4 mr-1" /> Add QR Code
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
