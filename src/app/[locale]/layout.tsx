'use client';

import { useApp } from '@/lib/store';

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useApp();
  return (
    <div lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
}
