'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const { locale } = useApp();
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => { setCountdown(c => (c > 0 ? c - 1 : 0)); }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
        <Mail className="h-8 w-8 text-emerald-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">{t(locale, 'auth.verifyEmail.title')}</h1>
      <p className="text-slate-500 mb-8 leading-relaxed">{t(locale, 'auth.verifyEmail.description')}</p>

      <Button variant="secondary" fullWidth size="lg" disabled={countdown > 0}>
        {countdown > 0
          ? t(locale, 'auth.verifyEmail.resendIn', { seconds: String(countdown) })
          : t(locale, 'auth.verifyEmail.resend')
        }
      </Button>

      <div className="mt-6">
        <Link href={`/${locale}/sign-in`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          {t(locale, 'auth.verifyEmail.backToSignIn')}
        </Link>
      </div>
    </div>
  );
}
