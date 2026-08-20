'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { providersApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ProviderSettingsPage() {
  const { locale, providerProfile, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ profession: '', title: '', bio: '', experience: '', locationCity: '' });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!providerProfile) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await providersApi.get(providerProfile.id);
        if (!cancelled) {
          setForm({
            profession: r.data.profession || '',
            title: r.data.title || '',
            bio: r.data.bio || '',
            experience: r.data.experience || '',
            locationCity: r.data.locationCity || '',
          });
        }
      } catch {
        // ignored
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [providerProfile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSave = async () => {
    if (!providerProfile) return;
    setSaving(true);
    try {
      await providersApi.update(providerProfile.id, form);
      showToast('Settings saved!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
      <Link href={`/${locale}/provider/workspace`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} /> Back to Workspace
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t(locale, 'providerWorkspace.settings')}</h1>
      <Card>
        <CardHeader><CardTitle>Provider Profile Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Profession" value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })} fullWidth />
          <Input label="Professional Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} fullWidth />
          <Textarea label="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} fullWidth />
          <Textarea label="Experience" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} fullWidth />
          <Input label="City" value={form.locationCity} onChange={e => setForm({ ...form, locationCity: e.target.value })} fullWidth />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {t(locale, 'settings.saveChanges')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
