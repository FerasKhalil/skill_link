'use client';
import Link from 'next/link';
import { useApp } from '@/lib/store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useApp();
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link href={`/${locale}`} className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white font-bold text-2xl">S</div>
            <span className="text-3xl font-bold">SkillLink</span>
          </Link>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Find Trusted Service Providers in Jordan</h1>
          <p className="text-lg text-emerald-100 leading-relaxed">Discover verified professionals for tutoring, skilled labour, and instrument services.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
