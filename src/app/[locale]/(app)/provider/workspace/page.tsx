'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { providersApi, bookingsApi, conversationsApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageCircle, Calendar, Star, Settings, Shield, Briefcase, ChevronRight, Loader2 } from 'lucide-react';

export default function ProviderWorkspacePage() {
  const { locale, user, providerProfile } = useApp();
  const [stats, setStats] = useState({ views: 0, messages: 0, bookings: 0, rating: 'N/A' });
  const [loading, setLoading] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!providerProfile) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        await Promise.allSettled([
          providersApi.get(providerProfile.id).then(r => {
            if (cancelled) return;
            const d = r.data;
            setStats({
              views: d.viewCount || 0,
              messages: 0,
              bookings: d.bookingCount || 0,
              rating: d.ratingAvg || 'N/A',
            });
          }),
          conversationsApi.list().then(r => { if (!cancelled) setStats(prev => ({ ...prev, messages: (r.data || []).length })); }),
          bookingsApi.list({ limit: '100' }).then(r => { if (!cancelled) setStats(prev => ({ ...prev, bookings: (r.data || []).length })); }),
        ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [providerProfile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const quickLinks = [
    { label: t(locale, 'providerWorkspace.services'), href: `/${locale}/provider/services`, icon: Briefcase },
    { label: t(locale, 'providerWorkspace.availability'), href: `/${locale}/provider/availability`, icon: Calendar },
    { label: t(locale, 'providerWorkspace.bookings'), href: `/${locale}/provider/bookings`, icon: Calendar },
    { label: t(locale, 'providerWorkspace.messages'), href: `/${locale}/provider/messages`, icon: MessageCircle },
    { label: t(locale, 'providerWorkspace.verification'), href: `/${locale}/provider/verification`, icon: Shield },
    { label: t(locale, 'providerWorkspace.settings'), href: `/${locale}/provider/settings`, icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t(locale, 'providerWorkspace.title')}</h1>
          <p className="text-slate-500">Welcome back, {user?.displayName || user?.firstName || 'Provider'}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Profile Views', value: stats.views, icon: Eye, color: 'bg-blue-50 text-blue-600' },
              { label: 'Messages', value: stats.messages, icon: MessageCircle, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Bookings', value: stats.bookings, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
              { label: 'Rating', value: stats.rating, icon: Star, color: 'bg-amber-50 text-amber-600' },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>{t(locale, 'providerWorkspace.quickActions')}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {quickLinks.map((link, i) => (
                    <Link key={i} href={link.href}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <link.icon className="h-5 w-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{link.label}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t(locale, 'providerWorkspace.verification')}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Verification Status</span>
                    <Badge variant={providerProfile?.verificationStatus === 'approved' ? 'success' : 'warning'} size="sm">
                      {providerProfile?.verificationStatus || 'none'}
                    </Badge>
                  </div>
                  <Link href={`/${locale}/provider/verification`}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                    View Details <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
