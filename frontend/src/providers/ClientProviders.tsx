'use client';

import { I18nProvider } from './I18nProvider';
import { ToastProvider } from './ToastProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>{children}</ToastProvider>
    </I18nProvider>
  );
}
