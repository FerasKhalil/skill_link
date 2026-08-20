'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { getDictionary } from '@/i18n';
import { StarRating } from '@/components/ui/star-rating';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { categoriesApi, providersApi } from '@/lib/api-client';
import { ArrowRight, Search, Shield, MapPin, BookOpen, Wrench, Music, ChevronRight, ArrowLeft } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  'book-open': <BookOpen className="h-8 w-8" />,
  'wrench': <Wrench className="h-8 w-8" />,
  'music': <Music className="h-8 w-8" />,
};

interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  icon: string | null;
  childCount: number;
  listingCount: number;
  children?: Category[];
}

interface Provider {
  id: string;
  slug: string;
  userDisplayName: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  profession: string | null;
  ratingAvg: number;
  ratingCount: number;
  locationCity: string | null;
  identityVerified: boolean;
}

export default function HomePage() {
  const { locale, user } = useApp();
  const router = useRouter();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const dict = getDictionary(locale);
  const steps = dict.home.howItWorksSteps;

  useEffect(() => {
    if (user) router.replace(`/${locale}/dashboard`);
  }, [user, locale, router]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [topProviders, setTopProviders] = useState<Provider[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(true);

  useEffect(() => {
    categoriesApi.list().then(res => setCategories((res.data || []).slice(0, 6))).catch(() => {}).finally(() => setCategoriesLoading(false));
    providersApi.list({ featured: 'true', limit: '4' }).then(res => setTopProviders((res.data || []).slice(0, 4))).catch(() => {}).finally(() => setProvidersLoading(false));
  }, []);

  if (user) return null;

  const getName = (c: Category) => locale === 'ar' ? c.nameAr : c.nameEn;

  return (
    <div dir={dir}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.08),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="success" className="mb-6">{t(locale, 'home.trustedBy')}</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              {t(locale, 'home.hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t(locale, 'home.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/${locale}/search`}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 transition-all hover:shadow-xl hover:shadow-emerald-600/30">
                <Search className="h-5 w-5" />
                {t(locale, 'home.hero.cta')}
              </Link>
              <Link href={`/${locale}/become-provider`}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 px-8 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                {t(locale, 'home.hero.ctaSecondary')}
                <ChevronRight className={`h-5 w-5 ${locale === 'ar' ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{t(locale, 'home.popularCategories')}</h2>
            <p className="text-slate-500">Browse our most popular service categories</p>
          </div>
          {categoriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-8 rounded-2xl border border-slate-200 bg-white">
                  <Skeleton className="h-16 w-16 rounded-2xl mb-5" />
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48 mb-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map(cat => (
                <Link key={cat.id} href={`/${locale}/categories/${cat.slug}`}
                  className="group p-8 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 bg-white">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                    {categoryIcons[cat.icon || ''] || <Search className="h-8 w-8" />}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{getName(cat)}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-600">{cat.listingCount} {t(locale, 'common.results')}</span>
                    <ChevronRight className={`h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors ${locale === 'ar' ? 'rotate-180' : ''}`} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{t(locale, 'home.howItWorks')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Providers */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-1">{t(locale, 'home.topProviders')}</h2>
              <p className="text-slate-500">Meet our highest-rated service providers</p>
            </div>
            <Link href={`/${locale}/search`}
              className={`hidden sm:flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              {t(locale, 'common.viewAll')}
              {locale === 'ar' ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </Link>
          </div>
          {providersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-start gap-3 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topProviders.map(provider => (
                <Link key={provider.id} href={`/${locale}/providers/${provider.slug}`}
                  className="group p-6 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm shrink-0">
                      {(provider.userDisplayName || `${provider.userFirstName || ''} ${provider.userLastName || ''}`.trim() || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{provider.userDisplayName || `${provider.userFirstName || ''} ${provider.userLastName || ''}`.trim() || 'Provider'}</h3>
                      <p className="text-sm text-slate-500 truncate">{provider.profession}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating rating={provider.ratingAvg || 0} size="sm" />
                    <span className="text-sm font-medium text-slate-700">{provider.ratingAvg}</span>
                    <span className="text-sm text-slate-400">({provider.ratingCount})</span>
                  </div>
                  {provider.locationCity && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{provider.locationCity}</span>
                    </div>
                  )}
                  {provider.identityVerified && (
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="success" size="sm">
                        <Shield className="h-3 w-3" />
                        {t(locale, 'common.verified')}
                      </Badge>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-emerald-600 to-emerald-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t(locale, 'home.ctaSection.title')}</h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">{t(locale, 'home.ctaSection.subtitle')}</p>
          <Link href={`/${locale}/become-provider`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-emerald-700 hover:bg-emerald-50 shadow-lg transition-all">
            {t(locale, 'home.ctaSection.button')}
            <ChevronRight className={`h-5 w-5 ${locale === 'ar' ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </section>
    </div>
  );
}
