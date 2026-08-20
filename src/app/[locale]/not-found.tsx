'use client';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  const { locale } = useApp();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <SearchX className="h-16 w-16 text-slate-300 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t(locale, 'notFound.title')}</h1>
        <p className="text-slate-500 mb-6">{t(locale, 'notFound.description')}</p>
        <Link href={`/${locale}`}>
          <Button size="lg">{t(locale, 'notFound.backHome')}</Button>
        </Link>
      </div>
    </div>
  );
}
