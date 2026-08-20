'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { providersApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function NewServicePage() {
  const { locale, showToast, providerProfile } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', categoryId: '', description: '', deliveryMode: 'onsite', price: '', priceModel: 'hourly' });

  useEffect(() => {
    fetch('/api/v1/categories')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerProfile) {
      showToast('Provider profile not found. Please complete your provider profile first.', 'error');
      router.push(`/${locale}/become-provider`);
      return;
    }
    setLoading(true);
    try {
      await providersApi.createListing(providerProfile.id, {
        titleEn: form.title,
        titleAr: form.title,
        descriptionEn: form.description,
        descriptionAr: form.description,
        categoryId: form.categoryId || undefined,
        pricingModel: form.priceModel,
        priceMin: form.price ? Number(form.price) : undefined,
        priceMax: form.price ? Number(form.price) : undefined,
        currency: 'JOD',
        deliveryModes: [form.deliveryMode],
        status: 'active',
      });
      showToast('Service created successfully!', 'success');
      router.push(`/${locale}/provider/services`);
    } catch (e: any) {
      showToast(e.message || 'Failed to create service', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!providerProfile) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
        <Link href={`/${locale}/provider/services`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} /> {t(locale, 'common.back')}
        </Link>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Provider Profile Required</h2>
            <p className="text-slate-500 mb-6">You need to complete your provider profile before creating a service listing.</p>
            <Link href={`/${locale}/become-provider`}>
              <Button>Complete Provider Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
      <Link href={`/${locale}/provider/services`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} /> {t(locale, 'common.back')}
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t(locale, 'providerOnboarding.services.addService')}</h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t(locale, 'providerOnboarding.services.serviceName')} fullWidth required
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Select label={t(locale, 'providerOnboarding.services.category')} fullWidth
              options={categories.filter((c: any) => !c.parentId).map((c: any) => ({ value: c.id, label: locale === 'ar' ? c.nameAr : c.nameEn }))}
              value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} />
            <Textarea label={t(locale, 'providerOnboarding.services.description')} fullWidth
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Select label={t(locale, 'search.deliveryMode')} fullWidth
              options={[{ value: 'onsite', label: 'At Your Location' }, { value: 'remote', label: 'Online / Remote' }, { value: 'both', label: 'Both' }]}
              value={form.deliveryMode} onChange={e => setForm({ ...form, deliveryMode: e.target.value })} />
            <Select label={t(locale, 'providerOnboarding.services.pricingModel')} fullWidth
              options={[{ value: 'hourly', label: 'Per Hour' }, { value: 'fixed', label: 'Fixed Price' }, { value: 'starting_from', label: 'Starting From' }, { value: 'quote_only', label: 'Quote Only' }]}
              value={form.priceModel} onChange={e => setForm({ ...form, priceModel: e.target.value })} />
            {form.priceModel !== 'quote_only' && (
              <Input label="Price (JOD)" type="number" fullWidth
                value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            )}
            <div className="flex gap-3 pt-2">
              <Link href={`/${locale}/provider/services`} className="flex-1">
                <Button type="button" variant="secondary" fullWidth>{t(locale, 'common.cancel')}</Button>
              </Link>
              <Button type="submit" fullWidth loading={loading}>{t(locale, 'common.save')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
