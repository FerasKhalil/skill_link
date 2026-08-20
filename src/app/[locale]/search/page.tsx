'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { mockListings, mockCategories } from '@/data/mock';
import { StarRating } from '@/components/ui/star-rating';
import { Badge } from '@/components/ui/badge';
import { getDeliveryModeLabel, getLocalizedText } from '@/lib/utils';
import { Search, SlidersHorizontal, MapPin, Shield, Grid, Map, X, ChevronDown } from 'lucide-react';

export default function SearchPage() {
  const { locale } = useApp();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get('q') || '');
      setSelectedCategory(params.get('category') || '');
    }
  }, []);

  const filteredListings = useMemo(() => {
    let results = [...mockListings];
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
    if (selectedCategory) {
      const cat = mockCategories.find(c => c.slug === selectedCategory);
      if (cat) {
        const catIds = [cat.id, ...(cat.children?.map(c => c.id) || [])];
        results = results.filter(l => catIds.includes(l.categoryId));
      }
    }
    if (verifiedOnly) {
      results = results.filter(l => l.provider?.verificationSummary.identity === 'approved');
    }
    if (deliveryMode) {
      results = results.filter(l => l.deliveryModes.some(m => m.mode === deliveryMode && m.enabled));
    }
    return results;
  }, [query, selectedCategory, verifiedOnly, deliveryMode]);

  const activeFiltersCount = [selectedCategory, verifiedOnly, deliveryMode].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          {query ? `${t(locale, 'search.title')}: "${query}"` : t(locale, 'search.title')}
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder={t(locale, 'common.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${showFilters ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <SlidersHorizontal className="h-4 w-4" />
              {t(locale, 'common.filters')}
              {activeFiltersCount > 0 && <span className="bg-emerald-600 text-white rounded-full px-1.5 py-0.5 text-xs">{activeFiltersCount}</span>}
            </button>
            <div className="flex border border-slate-200 rounded-xl overflow-hidden">
              <button onClick={() => setViewMode('list')}
                className={`px-3 py-2.5 ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Grid className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode('map')}
                className={`px-3 py-2.5 ${viewMode === 'map' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Map className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(locale, 'nav.categories')}</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none">
                <option value="">{t(locale, 'search.allCategories')}</option>
                {mockCategories.map(c => (
                  <optgroup key={c.id} label={c.name[locale]}>
                    <option value={c.slug}>{c.name[locale]}</option>
                    {c.children?.map(sub => <option key={sub.id} value={sub.slug}>  {sub.name[locale]}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(locale, 'search.deliveryMode')}</label>
              <select value={deliveryMode} onChange={e => setDeliveryMode(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none">
                <option value="">{t(locale, 'search.allCategories')}</option>
                <option value="online">{t(locale, 'common.online')}</option>
                <option value="provider_location">{t(locale, 'provider.deliveryModes.providerLocation')}</option>
                <option value="customer_location">{t(locale, 'provider.deliveryModes.customerLocation')}</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 w-full">
                <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <Shield className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-slate-700">{t(locale, 'search.verifiedOnly')}</span>
              </label>
            </div>
            <div className="flex items-end">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
                <option value="relevance">{t(locale, 'common.sortBy')}: {t(locale, 'common.relevance')}</option>
                <option value="rating">{t(locale, 'common.sortBy')}: {t(locale, 'common.highestRated')}</option>
                <option value="newest">{t(locale, 'common.sortBy')}: {t(locale, 'common.newest')}</option>
              </select>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button onClick={() => { setSelectedCategory(''); setDeliveryMode(''); setVerifiedOnly(false); }}
              className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              {t(locale, 'common.clearFilters')}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {t(locale, 'search.showingResults', { from: '1', to: String(filteredListings.length), total: String(filteredListings.length) })}
        </p>
      </div>

      {viewMode === 'map' ? (
        <div className="rounded-xl border border-slate-200 bg-slate-100 h-[500px] flex items-center justify-center text-slate-400">
          <div className="text-center">
            <Map className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm">Map view - Interactive map would be integrated here</p>
            <p className="text-xs mt-1">Showing {filteredListings.length} providers in Amman</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{t(locale, 'search.noResultsTitle')}</h3>
              <p className="text-slate-500">{t(locale, 'search.noResultsDescription')}</p>
            </div>
          ) : filteredListings.map(listing => (
            <Link key={listing.id} href={`/${locale}/providers/${listing.provider?.slug}`}
              className="block p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-md transition-all">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-lg shrink-0">
                  {listing.provider?.user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{listing.title}</h3>
                      <p className="text-sm text-slate-500">{listing.provider?.user.displayName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {listing.deliveryModes[0]?.pricing[0]?.amount && (
                        <p className="text-lg font-bold text-slate-900">
                          {listing.deliveryModes[0].pricing[0].amount} JOD
                          <span className="text-xs font-normal text-slate-500">/{listing.deliveryModes[0].pricing[0].unit}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{listing.description}</p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <StarRating rating={listing.provider?.rating || 0} size="sm" showValue />
                    <span className="text-sm text-slate-400">({listing.reviewCount})</span>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {listing.provider?.city}
                    </div>
                    {listing.provider?.verificationSummary.identity === 'approved' && (
                      <Badge variant="success" size="sm"><Shield className="h-3 w-3" />{t(locale, 'common.verified')}</Badge>
                    )}
                    {listing.deliveryModes.map(m => (
                      <Badge key={m.mode} variant="outline" size="sm">{getDeliveryModeLabel(m.mode, locale)}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
