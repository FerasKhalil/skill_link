'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { providersApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Clock, XCircle, Upload, Loader2, ArrowLeft } from 'lucide-react';

export default function VerificationPage() {
  const { locale, providerProfile } = useApp();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!providerProfile) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await providersApi.get(providerProfile.id);
        if (!cancelled) setProfile(r.data);
      } catch {
        // ignored
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [providerProfile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
        <Link href={`/${locale}/provider/workspace`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} /> Back to Workspace
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">{t(locale, 'providerWorkspace.verification')}</h1>
        <p className="text-slate-500">No provider profile found. Please complete onboarding first.</p>
      </div>
    );
  }

  const checks = [
    { label: t(locale, 'provider.verifiedEmail'), status: 'approved' },
    { label: t(locale, 'provider.verifiedPhone'), status: 'approved' },
    { label: t(locale, 'provider.verifiedIdentity'), status: profile.identityVerified ? 'approved' : profile.verificationStatus === 'pending' ? 'pending' : 'not_started' },
    { label: t(locale, 'provider.verifiedAffiliation'), status: profile.affiliationVerified ? 'approved' : 'not_started' },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
      <Link href={`/${locale}/provider/workspace`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} /> Back to Workspace
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t(locale, 'providerWorkspace.verification')}</h1>
      <div className="space-y-3">
        {checks.map((check, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {check.status === 'approved' ? <CheckCircle className="h-5 w-5 text-emerald-500" /> :
                 check.status === 'pending' ? <Clock className="h-5 w-5 text-amber-500" /> :
                 <XCircle className="h-5 w-5 text-slate-400" />}
                <span className="font-medium text-slate-900">{check.label}</span>
              </div>
              <Badge variant={check.status === 'approved' ? 'success' : check.status === 'pending' ? 'warning' : 'default'} size="sm">
                {check.status === 'approved' ? 'Verified' : check.status === 'pending' ? 'Pending' : 'Not Started'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardContent className="p-6 text-center">
          <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-3">Upload additional verification documents</p>
          <Button variant="outline">{t(locale, 'providerOnboarding.verification.uploadId')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
