'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function SignInPage() {
  const { locale, login, showToast, user } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    if (justLoggedIn && user) {
      if (redirectPath) {
        router.push(redirectPath);
      } else if (user.role === 'admin' || user.role === 'moderator') {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    }
  }, [justLoggedIn, user, locale, router, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      showToast(t(locale, 'auth.signIn.welcomeBack') || 'Welcome back!', 'success');
      setRedirectPath(searchParams.get('redirect'));
      setJustLoggedIn(true);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="lg:hidden mb-8">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xl">S</div>
          <span className="text-2xl font-bold text-slate-900">SkillLink</span>
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{t(locale, 'auth.signIn.title')}</h1>
      <p className="text-slate-500 mb-8">{t(locale, 'auth.signIn.subtitle')}</p>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t(locale, 'auth.signIn.email')} type="email" icon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required fullWidth />
        <Input label={t(locale, 'auth.signIn.password')} type={showPassword ? 'text' : 'password'}
          icon={<Lock className="h-4 w-4" />}
          suffix={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>}
          placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required fullWidth />
        <div className="flex items-center justify-end">
          <Link href={`/${locale}/forgot-password`} className="text-sm text-emerald-600 hover:text-emerald-700">
            {t(locale, 'auth.signIn.forgotPassword')}
          </Link>
        </div>
        <Button type="submit" fullWidth loading={loading} size="lg">{t(locale, 'auth.signIn.submit')}</Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          {t(locale, 'auth.signIn.noAccount')}{' '}
          <Link href={`/${locale}/sign-up`} className="font-medium text-emerald-600 hover:text-emerald-700">{t(locale, 'auth.signIn.signUp')}</Link>
        </p>
      </div>
    </div>
  );
}
