'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { locale } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{t(locale, 'auth.forgotPassword.title')}</h1>
        <p className="text-slate-500 mb-8">{t(locale, 'auth.forgotPassword.success')}</p>
        <Link href={`/${locale}/sign-in`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          {t(locale, 'auth.forgotPassword.backToSignIn')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{t(locale, 'auth.forgotPassword.title')}</h1>
      <p className="text-slate-500 mb-8">{t(locale, 'auth.forgotPassword.description')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t(locale, 'auth.forgotPassword.email')} type="email" icon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required fullWidth />
        <Button type="submit" fullWidth loading={loading} size="lg">{t(locale, 'auth.forgotPassword.submit')}</Button>
      </form>

      <div className="mt-6 text-center">
        <Link href={`/${locale}/sign-in`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />{t(locale, 'auth.forgotPassword.backToSignIn')}
        </Link>
      </div>
    </div>
  );
}
