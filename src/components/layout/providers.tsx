'use client';
import { ReactNode } from 'react';
import { AppProvider } from '@/lib/store';
import { Toast } from '@/components/ui/toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      {children}
      <Toast />
    </AppProvider>
  );
}
