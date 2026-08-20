'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { providersApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, User, Briefcase, FileCheck, Shield, ChevronRight, Loader2 } from 'lucide-react';

export default function BecomeProviderPage() {
  const { locale, showToast, fetchUser } = useApp();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ageConfirm: false, termsAccept: false, privacyAccept: false,
    profession: '', title: '', bio: '', experience: '', yearsExperience: '',
    city: 'Amman', neighborhood: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const steps = [
    { label: t(locale, 'providerOnboarding.steps.eligibility'), icon: CheckCircle },
    { label: t(locale, 'providerOnboarding.steps.profile'), icon: User },
    { label: t(locale, 'providerOnboarding.steps.services'), icon: Briefcase },
    { label: t(locale, 'providerOnboarding.steps.verification'), icon: Shield },
    { label: t(locale, 'providerOnboarding.steps.review'), icon: FileCheck },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await providersApi.submitApplication({
        profession: form.profession,
        title: form.title,
        bio: form.bio,
        experience: form.experience,
        yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience as string) : undefined,
        locationCity: form.city || undefined,
        termsAccepted: true,
      });
      await fetchUser();
      setSubmitted(true);
      showToast(t(locale, 'providerOnboarding.review.saved'), 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to submit application', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">{t(locale, 'providerOnboarding.status.pending')}</h1>
          <p className="text-slate-500 max-w-md mx-auto">Our team will review your application and identity documents within 2 business days. You will receive an email notification when your status changes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{t(locale, 'providerOnboarding.title')}</h1>
        <p className="text-slate-500">{t(locale, 'providerOnboarding.subtitle')}</p>
      </div>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              i === step ? 'bg-emerald-600 text-white' : i < step ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />}
          </div>
        ))}
      </div>

      <Card>
        {step === 0 && (
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{t(locale, 'providerOnboarding.eligibility.title')}</h2>
            <Checkbox label={t(locale, 'providerOnboarding.eligibility.ageConfirm')} checked={form.ageConfirm}
              onChange={e => setForm({ ...form, ageConfirm: e.target.checked })} />
            <Checkbox label={t(locale, 'providerOnboarding.eligibility.termsAccept')} checked={form.termsAccept}
              onChange={e => setForm({ ...form, termsAccept: e.target.checked })} />
            <Checkbox label={t(locale, 'providerOnboarding.eligibility.privacyAccept')} checked={form.privacyAccept}
              onChange={e => setForm({ ...form, privacyAccept: e.target.checked })} />
            <Button onClick={() => setStep(1)} disabled={!form.ageConfirm || !form.termsAccept || !form.privacyAccept}>
              {t(locale, 'providerOnboarding.eligibility.continue')}
            </Button>
          </CardContent>
        )}

        {step === 1 && (
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{t(locale, 'providerOnboarding.profile.title')}</h2>
            <Input label={t(locale, 'providerOnboarding.profile.profession')} value={form.profession}
              onChange={e => setForm({ ...form, profession: e.target.value })} fullWidth required />
            <Input label={t(locale, 'providerOnboarding.profile.professionalTitle')} placeholder={t(locale, 'providerOnboarding.profile.titlePlaceholder')}
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} fullWidth />
            <Textarea label={t(locale, 'providerOnboarding.profile.bio')} placeholder={t(locale, 'providerOnboarding.profile.bioPlaceholder')}
              value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} fullWidth />
            <Textarea label={t(locale, 'providerOnboarding.profile.experience')}
              value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} fullWidth />
            <Input label="Years of Experience" type="number" placeholder="e.g. 5"
              value={form.yearsExperience} onChange={e => setForm({ ...form, yearsExperience: e.target.value })} fullWidth />
            <Input label="City" value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })} fullWidth />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => setStep(2)} disabled={!form.profession || !form.bio}>
                {t(locale, 'providerOnboarding.eligibility.continue')}
              </Button>
            </div>
          </CardContent>
        )}

        {step === 2 && (
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{t(locale, 'providerOnboarding.services.title')}</h2>
            <p className="text-sm text-slate-500">You can add services after your application is approved.</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>
                {t(locale, 'providerOnboarding.eligibility.continue')}
              </Button>
            </div>
          </CardContent>
        )}

        {step === 3 && (
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{t(locale, 'providerOnboarding.verification.title')}</h2>
            <p className="text-sm text-slate-500">Identity verification will be completed after submission.</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>
                {t(locale, 'providerOnboarding.eligibility.continue')}
              </Button>
            </div>
          </CardContent>
        )}

        {step === 4 && (
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{t(locale, 'providerOnboarding.review.title')}</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Profession:</span> {form.profession}</p>
              <p><span className="font-medium">Title:</span> {form.title || 'N/A'}</p>
              <p><span className="font-medium">Bio:</span> {form.bio}</p>
              <p><span className="font-medium">Experience:</span> {form.experience || 'N/A'}</p>
              <p><span className="font-medium">Years:</span> {form.yearsExperience || 'N/A'}</p>
              <p><span className="font-medium">City:</span> {form.city || 'N/A'}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {t(locale, 'providerOnboarding.review.submit')}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
