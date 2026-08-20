'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { StarRating } from '@/components/ui/star-rating';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton';
import { getDeliveryModeLabel } from '@/lib/utils';
import { Search, SlidersHorizontal, MapPin, Shield, Grid, Map, ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchResult {
  id: string;
  listingId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  providerId: string;
  providerName: string;
  providerAvatar: string | null;
  providerVerified: boolean;
  categoryName: string;
  subcategoryName: string | null;
  ratingAvg: number;
  ratingCount: number;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  deliveryModes: string[];
  serviceAreas: string[];
  locationCity: string | null;
}

interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  icon: string | null;
  childCount: number;
  listingCount: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const jsonFetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`Request failed: ${r.status}`);
  return r.json();
});

function SearchPageContent() {
  const { locale } = useApp();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialDeliveryMode = searchParams.get('deliveryMode') || '';
  const initialVerified = searchParams.get('verified') === 'true';
  const initialSort = searchParams.get('sort') || 'relevance';

  const [query, setQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerified);
  const [deliveryMode, setDeliveryMode] = useState(initialDeliveryMode);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState(initialSort);
  const [page, setPage] = useState(1);

  const apiParams = new URLSearchParams({ page: String(page), limit: '20' });
  if (query) apiParams.set('q', query);
  if (selectedCategory) apiParams.set('category', selectedCategory);
  if (deliveryMode) apiParams.set('deliveryMode', deliveryMode);
  if (verifiedOnly) apiParams.set('verified', 'true');
  if (sortBy !== 'relevance') apiParams.set('sort', sortBy);

  const { data: searchRes, isLoading: searchLoading, error: searchError, mutate: refetchSearch } = useSWR<PaginatedResponse<SearchResult>>(
    `/api/v1/search?${apiParams.toString()}`,
    jsonFetcher,
  );

  const { data: catRes } = useSWR<PaginatedResponse<Category>>('/api/v1/categories', jsonFetcher);

  const results = searchRes?.data || [];
  const pagination = searchRes?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };
  const categories = catRes?.data || [];
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const loading = !mounted || searchLoading;
  const error = searchError instanceof Error ? searchError.message : null;

  const activeFiltersCount = [selectedCategory, verifiedOnly, deliveryMode].filter(Boolean).length;

  const getTitle = (r: SearchResult) => locale === 'ar' ? r.titleAr || r.titleEn : r.titleEn || r.titleAr;
  const getDescription = (r: SearchResult) => locale === 'ar' ? r.descriptionAr || r.descriptionEn : r.descriptionEn || r.descriptionAr;

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
              onKeyDown={e => e.key === 'Enter' && setPage(1)}
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
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{locale === 'ar' ? c.nameAr : c.nameEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(locale, 'search.deliveryMode')}</label>
              <select value={deliveryMode} onChange={e => setDeliveryMode(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none">
                <option value="">{t(locale, 'search.allCategories')}</option>
                <option value="remote">{t(locale, 'common.online')}</option>
                <option value="onsite">{t(locale, 'provider.deliveryModes.providerLocation')}</option>
                <option value="both">{t(locale, 'common.both')}</option>
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
        <div className="text-sm text-slate-500">
          {loading ? (
            <Skeleton className="inline-block h-4 w-48" />
          ) : (
            t(locale, 'search.showingResults', {
              from: String((pagination.page - 1) * pagination.limit + 1),
              to: String(Math.min(pagination.page * pagination.limit, pagination.total)),
              total: String(pagination.total),
            })
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => refetchSearch()} className="mt-2 text-sm font-medium text-red-600 hover:text-red-700">
            Retry
          </button>
        </div>
      )}

      {viewMode === 'map' ? (
        <div className="rounded-xl border border-slate-200 bg-slate-100 h-[500px] flex items-center justify-center text-slate-400">
          <div className="text-center">
            <Map className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm">{t(locale, 'search.mapPlaceholder')}</p>
            <p className="text-xs mt-1">{t(locale, 'search.showingProviders', { count: String(pagination.total) })}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          ) : results.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title={t(locale, 'search.noResultsTitle')}
              description={t(locale, 'search.noResultsDescription')}
            />
          ) : (
            results.map((r, idx) => (
              <Link key={r.id || r.listingId || idx} href={`/${locale}/providers/${r.providerId}`}
                className="block p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-lg shrink-0 overflow-hidden">
                    {r.providerAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.providerAvatar} alt={r.providerName} className="w-full h-full object-cover" />
                    ) : (
                      (r.providerName || '?').split(' ').map(n => n[0]).join('').slice(0, 2)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{getTitle(r)}</h3>
                        <p className="text-sm text-slate-500">{r.providerName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {r.priceMin != null && (
                          <p className="text-lg font-bold text-slate-900">
                            {r.priceMin} {r.currency}
                            {r.priceMax != null && r.priceMax !== r.priceMin && (
                              <span className="text-xs font-normal text-slate-500"> - {r.priceMax} {r.currency}</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{getDescription(r)}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <StarRating rating={r.ratingAvg} size="sm" showValue />
                      <span className="text-sm text-slate-400">({r.ratingCount})</span>
                      {r.locationCity && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {r.locationCity}
                        </div>
                      )}
                      {r.providerVerified && (
                        <Badge variant="success" size="sm"><Shield className="h-3 w-3" />{t(locale, 'common.verified')}</Badge>
                      )}
                      {(r.deliveryModes || []).map(mode => (
                        <Badge key={mode} variant="outline" size="sm">{getDeliveryModeLabel(mode, locale)}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
            const startPage = Math.max(1, pagination.page - 2);
            const p = startPage + i;
            if (p > pagination.totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium ${p === pagination.page ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-12 w-full" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
