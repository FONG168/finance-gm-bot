'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Shield, User, Download, Trash2,
  AlertTriangle, X, Smartphone, Copy, Check,
} from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';

function SectionHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
    </div>
  );
}

function InfoRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center justify-between px-4 py-3.5 gap-3">
      <p className="text-xs text-muted-foreground flex-shrink-0">{label}</p>
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-sm font-medium truncate text-right">{value}</p>
        {copyable && (
          <button onClick={copy} className="flex-shrink-0 w-6 h-6 rounded-lg bg-secondary flex items-center justify-center">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
          </button>
        )}
      </div>
    </div>
  );
}

function DeleteModal({ onConfirm, onClose, loading }: {
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [typed, setTyped] = useState('');
  const canDelete = typed === 'DELETE';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-sm rounded-3xl bg-card border border-rose-500/30 p-6"
          style={{ boxShadow: '0 0 0 1px rgba(239,68,68,0.15), 0 24px 48px rgba(0,0,0,0.5)' }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-center mb-1">Delete Account</h2>
          <p className="text-sm text-muted-foreground text-center mb-4">
            This permanently deletes all your data — transactions, accounts, and reports. This cannot be undone.
          </p>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 mb-4">
            <p className="text-xs text-rose-400 font-medium mb-2">Type <span className="font-bold">DELETE</span> to confirm</p>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value.toUpperCase())}
              placeholder="DELETE"
              className="w-full bg-transparent text-sm font-mono outline-none text-foreground placeholder-muted-foreground/50"
            />
          </div>

          <button
            onClick={onConfirm}
            disabled={!canDelete || loading}
            className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
            style={{
              background: canDelete ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(239,68,68,0.2)',
              color: canDelete ? 'white' : 'rgba(239,68,68,0.5)',
              cursor: canDelete ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Deleting...' : 'Permanently Delete Account'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function PrivacyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await apiService.user.exportData();
    } catch (err) {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiService.user.deleteAccount();
      localStorage.clear();
      router.replace('/');
    } catch {
      alert('Failed to delete account. Please try again.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const loginTime = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Privacy & Security</h1>
      </div>

      <div className="px-4 max-w-2xl mx-auto space-y-5">

        {/* Account Info */}
        <div>
          <SectionHeader icon={User} title="Telegram Account" color="#229ED9" />
          <div className="rounded-2xl bg-card border border-border divide-y divide-border/50">
            <InfoRow label="Name" value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '—'} />
            {user?.username && <InfoRow label="Username" value={`@${user.username}`} copyable />}
            <InfoRow label="Telegram ID" value={user?.telegramId ? String(user.telegramId) : '—'} copyable />
            <InfoRow label="Account Linked" value="✓ Telegram" />
          </div>
        </div>

        {/* Session */}
        <div>
          <SectionHeader icon={Smartphone} title="Session" color="#6366f1" />
          <div className="rounded-2xl bg-card border border-border divide-y divide-border/50">
            <InfoRow label="Current Session" value="Active" />
            <InfoRow label="Platform" value="Telegram Mini App" />
            <InfoRow label="Member Since" value={loginTime} />
            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                router.replace('/');
              }}
              className="w-full flex items-center justify-between px-4 py-3.5 text-rose-400 hover:bg-rose-500/5 transition-colors"
            >
              <span className="text-sm font-medium">Logout</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>

        {/* Export Data */}
        <div>
          <SectionHeader icon={Download} title="Your Data" color="#10b981" />
          <div className="rounded-2xl bg-card border border-border">
            <div className="px-4 py-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <Download className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Export My Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Download all your transactions, accounts, and reports as a JSON file.
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleExport}
                disabled={exporting}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Preparing Export...' : 'Download JSON Export'}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <SectionHeader icon={AlertTriangle} title="Danger Zone" color="#ef4444" />
          <div className="rounded-2xl border border-rose-500/25 overflow-hidden"
            style={{ background: 'rgba(239,68,68,0.05)' }}>
            <div className="px-4 py-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-rose-400">Delete My Account</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently removes all your data. This action cannot be reversed.
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-rose-400 transition-colors"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                Delete My Account
              </motion.button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-2">
          Your data is stored securely and never shared with third parties.
        </p>
      </div>

      <BottomNav />

      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDelete}
          onClose={() => setShowDeleteModal(false)}
          loading={deleting}
        />
      )}
    </div>
  );
}
