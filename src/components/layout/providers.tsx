'use client';
import { ReactNode } from 'react';
import { AppProvider } from '@/lib/store';
import { Toast } from '@/components/ui/toast';

export function Providers({ children, locale = 'en' }: { children: ReactNode; locale?: string }) {
  return (
    <AppProvider initialLocale={locale as any}>
      {children}
      <Toast />
    </AppProvider>
  );
}
