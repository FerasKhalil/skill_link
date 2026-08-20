'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const { locale, user, showToast } = useApp();
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => { setCountdown(c => (c > 0 ? c - 1 : 0)); }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResend = async () => {
    setResending(true);
    try {
      await fetch('/api/v1/auth/verify-email/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });
      showToast('Verification email sent!', 'success');
      setCountdown(60);
    } catch {
      showToast('Failed to resend email. Please try again.', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
        <Mail className="h-8 w-8 text-emerald-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">{t(locale, 'auth.verifyEmail.title')}</h1>
      <p className="text-slate-500 mb-8 leading-relaxed">{t(locale, 'auth.verifyEmail.description')}</p>

      <Button variant="secondary" fullWidth size="lg" disabled={countdown > 0 || resending} onClick={handleResend}>
        {resending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</>
        ) : countdown > 0 ? (
          t(locale, 'auth.verifyEmail.resendIn', { seconds: String(countdown) })
        ) : (
          t(locale, 'auth.verifyEmail.resend')
        )}
      </Button>

      <div className="mt-6">
        <Link href={`/${locale}/sign-in`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          {t(locale, 'auth.verifyEmail.backToSignIn')}
        </Link>
      </div>
    </div>
  );
}
