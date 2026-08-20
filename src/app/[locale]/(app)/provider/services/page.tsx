'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { providersApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pause, Play, Loader2, ArrowLeft, Briefcase } from 'lucide-react';

export default function ProviderServicesPage() {
  const { locale, providerProfile, showToast } = useApp();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!providerProfile) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await providersApi.getListings(providerProfile.id);
        if (!cancelled) setListings(r.data || []);
      } catch (e: any) {
        if (!cancelled) showToast(e.message || 'Failed to load listings', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [providerProfile, showToast]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleToggleStatus = async (listing: any) => {
    try {
      const newStatus = listing.status === 'active' ? 'paused' : 'active';
      await providersApi.updateListing(providerProfile!.id, listing.id, { status: newStatus });
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l));
      showToast(`Listing ${newStatus}`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to update listing', 'error');
    }
  };

  if (!providerProfile && !loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <Link href={`/${locale}/provider/workspace`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} /> Back to Workspace
        </Link>
        <div className="text-center py-16">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Complete Your Provider Profile</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">You need to complete your provider profile before you can create service listings.</p>
          <Link href={`/${locale}/become-provider`}>
            <Button>Complete Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      <Link href={`/${locale}/provider/workspace`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} /> Back to Workspace
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t(locale, 'providerWorkspace.services')}</h1>
        {providerProfile && (
          <Link href={`/${locale}/provider/services/new`}>
            <Button size="sm">+ New Listing</Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No listings yet. Create your first service listing to start receiving bookings.</p>
          <Link href={`/${locale}/provider/services/new`}>
            <Button size="sm">+ Create First Listing</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing: any) => (
            <Card key={listing.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{locale === 'ar' ? listing.titleAr : listing.titleEn}</h3>
                      <Badge variant={listing.status === 'active' ? 'success' : listing.status === 'paused' ? 'warning' : 'default'} size="sm">
                        {listing.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">{locale === 'ar' ? listing.descriptionAr : listing.descriptionEn}</p>
                    {listing.priceMin && (
                      <p className="text-sm text-emerald-600 font-medium">
                        {listing.priceMin}{listing.priceMax ? ` - ${listing.priceMax}` : ''} {listing.currency || 'JOD'} / {listing.pricingModel}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(listing)}>
                      {listing.status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
