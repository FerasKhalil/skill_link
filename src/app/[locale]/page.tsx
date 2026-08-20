'use client';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { StarRating } from '@/components/ui/star-rating';
import { Badge } from '@/components/ui/badge';
import { mockCategories, mockProviderProfiles, mockListings } from '@/data/mock';
import { ArrowRight, Search, Users, MessageCircle, Star, CheckCircle, Shield, MapPin, BookOpen, Wrench, Music, ChevronRight, ArrowLeft } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  'book-open': <BookOpen className="h-8 w-8" />,
  'wrench': <Wrench className="h-8 w-8" />,
  'music': <Music className="h-8 w-8" />,
};

export default function HomePage() {
  const { locale } = useApp();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const steps = t(locale, 'home.howItWorksSteps') as unknown as Array<{title: string; description: string}>;

  return (
    <div dir={dir}>
      <Header />
      <main>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockCategories.map(cat => (
                <Link key={cat.id} href={`/${locale}/categories/${cat.slug}`}
                  className="group p-8 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 bg-white">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                    {categoryIcons[cat.icon || ''] || <Search className="h-8 w-8" />}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{cat.name[locale]}</h3>
                  <p className="text-sm text-slate-500 mb-4">{cat.description[locale]}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-600">{cat.listingCount} {t(locale, 'common.results')}</span>
                    <ChevronRight className={`h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors ${locale === 'ar' ? 'rotate-180' : ''}`} />
                  </div>
                  {cat.children && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      {cat.children.slice(0, 4).map(sub => (
                        <span key={sub.id} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{sub.name[locale]}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockProviderProfiles.slice(0, 4).map(provider => (
                <Link key={provider.id} href={`/${locale}/providers/${provider.slug}`}
                  className="group p-6 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm shrink-0">
                      {provider.user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{provider.user.displayName}</h3>
                      <p className="text-sm text-slate-500 truncate">{provider.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating rating={provider.rating || 0} size="sm" />
                    <span className="text-sm font-medium text-slate-700">{provider.rating}</span>
                    <span className="text-sm text-slate-400">({provider.reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{provider.city}{provider.neighborhood ? `, ${provider.neighborhood}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {provider.verificationSummary.identity === 'approved' && (
                      <Badge variant="success" size="sm">
                        <Shield className="h-3 w-3" />
                        {t(locale, 'common.verified')}
                      </Badge>
                    )}
                    {provider.verificationSummary.affiliation === 'approved' && (
                      <Badge variant="info" size="sm">Affiliation</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
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
      </main>
      <Footer />
    </div>
  );
}
