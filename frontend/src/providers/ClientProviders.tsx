'use client';

import { I18nProvider } from './I18nProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}
