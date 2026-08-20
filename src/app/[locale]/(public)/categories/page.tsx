'use client';
import Link from 'next/link';
import useSWR from 'swr';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { BookOpen, Wrench, Music, GraduationCap, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  icon: string | null;
  childCount: number;
  listingCount: number;
}

const icons: Record<string, React.ReactNode> = {
  'book-open': <BookOpen className="h-8 w-8" />,
  'wrench': <Wrench className="h-8 w-8" />,
  'music': <Music className="h-8 w-8" />,
  'graduation-cap': <GraduationCap className="h-8 w-8" />,
};

const jsonFetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error(`Request failed: ${r.status}`);
  return r.json();
});

export default function CategoriesPage() {
  const { locale } = useApp();
  const { data, isLoading, error } = useSWR<{ data: Category[] }>('/api/v1/categories', jsonFetcher);

  const categories = data?.data || [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t(locale, 'categories.title')}</h1>
        <p className="text-slate-500">{t(locale, 'categories.subtitle')}</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
          <p className="text-sm text-red-700">{error instanceof Error ? error.message : 'Failed to load categories'}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl border border-slate-200 bg-white">
              <Skeleton className="h-14 w-14 rounded-2xl mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title={t(locale, 'categories.title')}
          description={t(locale, 'categories.subtitle')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <Link key={cat.id} href={`/${locale}/categories/${cat.slug}`}
              className="group p-6 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all bg-white">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                {icons[cat.icon || ''] || <BookOpen className="h-8 w-8" />}
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">{locale === 'ar' ? cat.nameAr : cat.nameEn}</h2>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-emerald-600">{cat.listingCount} {t(locale, 'common.results')}</span>
                <ChevronRight className={`h-5 w-5 text-slate-400 group-hover:text-emerald-600 ${locale === 'ar' ? 'rotate-180' : ''}`} />
              </div>
              {cat.childCount > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">{t(locale, 'categories.subcategories')}</p>
                  <p className="text-sm text-slate-500">{cat.childCount} {t(locale, 'categories.subcategories')}</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
