'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'rounded-lg border p-4 shadow-lg text-sm flex items-start gap-3 animate-in slide-in-from-bottom-2',
              t.variant === 'destructive' && 'border-red-500/30 bg-red-950 text-red-200',
              t.variant === 'success' && 'border-green-500/30 bg-green-950 text-green-200',
              !t.variant || t.variant === 'default' ? 'border-border bg-card text-foreground' : ''
            )}
          >
            <div className="flex-1">
              <p className="font-semibold">{t.title}</p>
              {t.description && <p className="text-muted-foreground mt-0.5">{t.description}</p>}
            </div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function Toaster() {
  return null;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
