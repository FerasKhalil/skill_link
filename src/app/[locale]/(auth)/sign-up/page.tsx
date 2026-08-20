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
  const { locale, register, showToast } = useApp();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({ email, password, firstName, lastName, locale });
      showToast(t(locale, 'auth.signUp.success') || 'Account created successfully!', 'success');
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{t(locale, 'auth.signUp.title')}</h1>
      <p className="text-slate-500 mb-8">{t(locale, 'auth.signUp.subtitle')}</p>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" icon={<User className="h-4 w-4" />}
            placeholder="Ahmad" value={firstName} onChange={e => setFirstName(e.target.value)} required fullWidth />
          <Input label="Last Name"
            placeholder="Al-Khatib" value={lastName} onChange={e => setLastName(e.target.value)} required fullWidth />
        </div>
        <Input label={t(locale, 'auth.signUp.email')} type="email" icon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required fullWidth autoComplete="email" />
        <Input label={t(locale, 'auth.signUp.password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password"
          icon={<Lock className="h-4 w-4" />}
          suffix={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>}
          placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required fullWidth minLength={8} />
        <Input label={t(locale, 'auth.signUp.confirmPassword')} type="password" autoComplete="new-password"
          icon={<Lock className="h-4 w-4" />}
          placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required fullWidth />

        <Select label={t(locale, 'auth.signUp.preferredLanguage')} fullWidth
          options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]}
          value={locale} onChange={() => {}} disabled />

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
