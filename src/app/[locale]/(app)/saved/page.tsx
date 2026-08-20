'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { savedApi } from '@/lib/api-client';
import { Bookmark, Star, MapPin, Loader2 } from 'lucide-react';

export default function SavedPage() {
  const { locale, showToast } = useApp();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    savedApi.list()
      .then(r => setSaved(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (providerId: string) => {
    try {
      await savedApi.unsave(providerId);
      setSaved(prev => prev.filter(s => s.provider?.id !== providerId));
      showToast('Provider removed from saved', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to unsave', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t(locale, 'nav.saved')}</h1>
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : saved.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{t(locale, 'common.noResults')}</h3>
          <p className="text-slate-500 mb-4">Save providers to quickly find them later.</p>
          <Link href={`/${locale}/search`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
            {t(locale, 'home.hero.cta')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {saved.map((item: any) => {
            const provider = item.provider;
            return (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-4">
                  <Link href={`/${locale}/providers/${provider?.id}`} className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm shrink-0">
                    {item.user?.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/${locale}/providers/${provider?.id}`} className="font-medium text-slate-900 hover:text-emerald-600 block truncate">{item.user?.displayName || 'Provider'}</Link>
                    <p className="text-sm text-slate-500 truncate">{provider?.profession || provider?.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {provider?.ratingAvg && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium">{provider.ratingAvg}</span>
                        </div>
                      )}
                      {provider?.locationCity && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3 w-3" />{provider.locationCity}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleUnsave(provider?.id)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                    <Bookmark className="h-5 w-5 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
