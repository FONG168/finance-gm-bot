'use client';

import '@/lib/i18n';
import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle; iconClass: string }> = {
  success: { icon: CheckCircle, iconClass: 'text-emerald-600' },
  error: { icon: AlertCircle, iconClass: 'text-rose-600' },
  info: { icon: Info, iconClass: 'text-violet-600' },
};

let nextId = 1;
const DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ToastVariant) => {
    const id = nextId++;
    setItems((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), DISMISS_MS);
  }, [dismiss]);

  const value: ToastContextValue = {
    toast: {
      success: (message: string) => show(message, 'success'),
      error: (message: string) => show(message, 'error'),
      info: (message: string) => show(message, 'info'),
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-3 inset-x-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
        <AnimatePresence>
          {items.map((item) => {
            const { icon: Icon, iconClass } = VARIANT_STYLES[item.variant];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto w-full max-w-sm bg-card border border-border shadow-lg rounded-2xl px-4 py-3 flex items-center gap-2.5"
              >
                <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${iconClass}`} />
                <p className="text-xs font-semibold flex-1 min-w-0 break-words">{item.message}</p>
                <button
                  onClick={() => dismiss(item.id)}
                  className="flex-shrink-0 text-muted-foreground active:opacity-60"
                  aria-label={t('common.dismiss')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
