'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

export default function SignUpPage() {
  const { locale, setUser } = useApp();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setUser({ id: 'user-new', email: form.email, displayName: form.name, preferredLocale: locale, accountState: 'pending_verification', roles: ['customer'], createdAt: new Date().toISOString() });
    router.push(`/${locale}/verify-email`);
    setLoading(false);
  };

  return (
    <div>
      <div className="lg:hidden mb-8">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xl">S</div>
          <span className="text-2xl font-bold text-slate-900">SkillLink</span>
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{t(locale, 'auth.signUp.title')}</h1>
      <p className="text-slate-500 mb-8">{t(locale, 'auth.signUp.subtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t(locale, 'auth.signUp.displayName')} icon={<User className="h-4 w-4" />}
          placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required fullWidth />
        <Input label={t(locale, 'auth.signUp.email')} type="email" icon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required fullWidth />
        <Input label={t(locale, 'auth.signUp.password')} type={showPassword ? 'text' : 'password'}
          icon={<Lock className="h-4 w-4" />}
          suffix={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>}
          placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required fullWidth />
        <Input label={t(locale, 'auth.signUp.confirmPassword')} type="password"
          icon={<Lock className="h-4 w-4" />}
          placeholder="••••••••" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required fullWidth />

        <Select label={t(locale, 'auth.signUp.preferredLanguage')} fullWidth
          options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]}
          value={locale} onChange={(e) => {}} />

        <Checkbox label={t(locale, 'auth.signUp.acceptTerms')} checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} />
        <Checkbox label={t(locale, 'auth.signUp.acceptPrivacy')} checked={acceptPrivacy} onChange={e => setAcceptPrivacy(e.target.checked)} />

        <Button type="submit" fullWidth loading={loading} size="lg" disabled={!acceptTerms || !acceptPrivacy}>
          {t(locale, 'auth.signUp.submit')}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          {t(locale, 'auth.signUp.hasAccount')}{' '}
          <Link href={`/${locale}/sign-in`} className="font-medium text-emerald-600 hover:text-emerald-700">{t(locale, 'auth.signUp.signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
