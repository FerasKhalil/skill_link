'use client';
import { useState, useRef } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { usersApi, authApi, mediaApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Bell, Shield, Loader2, Camera } from 'lucide-react';

export default function SettingsPage() {
  const { locale, user, setLocale, setUser, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    displayName: user?.displayName ?? '',
    phone: user?.phone ?? '',
    locale: locale,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    messageNotifications: true,
    bookingNotifications: true,
  });

  const tabs = [
    { id: 'profile', label: t(locale, 'settings.profile'), icon: User },
    { id: 'notifications', label: t(locale, 'settings.notifications'), icon: Bell },
    { id: 'security', label: t(locale, 'settings.security'), icon: Shield },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await usersApi.updateMe({
        displayName: form.displayName || undefined,
        phone: form.phone || undefined,
        locale: form.locale,
      });
      setUser(res.data);
      if (form.locale !== locale) setLocale(form.locale as 'en' | 'ar');
      showToast(t(locale, 'settings.saved'), 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadRes = await mediaApi.upload(file, 'profile_image');
      const avatarUrl = uploadRes.data.url;
      await usersApi.updateMe({ avatarUrl });
      setUser({ ...user, avatarUrl } as any);
      showToast('Profile image updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast(t(locale, 'settings.passwordChanged'), 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t(locale, 'settings.title')}</h1>

      <div className="flex gap-6">
        <nav className="w-48 shrink-0 hidden md:block">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-1 transition-colors ${
                activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader><CardTitle>{t(locale, 'settings.profile')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        (user?.displayName || user?.firstName || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {uploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user?.displayName || 'No name set'}</p>
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-sm text-emerald-600 hover:text-emerald-700">
                      {uploading ? 'Uploading...' : 'Change photo'}
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
                </div>
                <Separator />
                <Input label={t(locale, 'settings.displayName')} value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })} fullWidth />
                <Input label={t(locale, 'settings.email')} defaultValue={user?.email ?? ''} type="email" fullWidth disabled />
                <Input label={t(locale, 'settings.phone')} value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" fullWidth />
                <Select label={t(locale, 'settings.language')} fullWidth
                  options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]}
                  value={form.locale} onChange={e => setForm({ ...form, locale: e.target.value as 'en' | 'ar' })} />
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {t(locale, 'settings.saveChanges')}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader><CardTitle>{t(locale, 'settings.notifications')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {(['emailNotifications', 'messageNotifications', 'bookingNotifications'] as const).map(key => (
                  <label key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <span className="text-sm font-medium text-slate-700">{t(locale, `settings.${key}`)}</span>
                    <input
                      type="checkbox"
                      checked={notifications[key]}
                      onChange={e => setNotifications({ ...notifications, [key]: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-600"
                    />
                  </label>
                ))}
                <Button onClick={() => showToast(t(locale, 'settings.saved'), 'success')}>{t(locale, 'settings.saveChanges')}</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader><CardTitle>{t(locale, 'settings.security')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900">{t(locale, 'settings.changePassword')}</h3>
                <Input label="Current password" type="password" autoComplete="current-password" value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} fullWidth />
                <Input label="New password" type="password" autoComplete="new-password" value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} fullWidth />
                <Input label="Confirm new password" type="password" autoComplete="new-password" value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} fullWidth />
                <Button onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {t(locale, 'settings.changePassword')}
                </Button>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">{t(locale, 'settings.sessions')}</h3>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-700">Current session</p>
                    <p className="text-xs text-slate-500">Active now</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
