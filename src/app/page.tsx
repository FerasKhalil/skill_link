'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';

export default function RootPage() {
  const { locale } = useApp();
  const router = useRouter();
  useEffect(() => { router.replace(`/${locale}`); }, [locale, router]);
  return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-slate-400">Loading...</div></div>;
}
