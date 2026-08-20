'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { categoriesApi } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { BookOpen, Wrench, Music, ChevronRight } from 'lucide-react';

const icons: Record<string, React.ReactNode> = {
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

export default function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { locale } = useApp();
  const [cat, setCat] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => {
      categoriesApi.list()
        .then(async (res) => {
          const allCategories = (res.data || []) as Category[];
          const found = allCategories.find(c => c.slug === p.slug);
          if (!found) {
            setError('Category not found');
            return;
          }
          if (found.childCount > 0) {
            try {
              const detailRes = await categoriesApi.get(found.id);
              setCat({ ...found, ...(detailRes.data || {}) });
            } catch {
              setCat(found);
            }
          } else {
            setCat(found);
          }
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load category'))
        .finally(() => setLoading(false));
    });
  }, [params]);

  const getName = (c: Category) => locale === 'ar' ? c.nameAr : c.nameEn;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {loading ? (
        <div>
          <Skeleton className="h-4 w-64 mb-6" />
          <Skeleton className="h-16 w-16 rounded-2xl mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      ) : error || !cat ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title={error || 'Category not found'}
          description="The category you're looking for doesn't exist."
        />
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href={`/${locale}/categories`} className="hover:text-emerald-600">{t(locale, 'nav.categories')}</Link>
            <ChevronRight className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
            <span className="text-slate-900 font-medium">{getName(cat)}</span>
          </div>

          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              {icons[cat.icon || ''] || <BookOpen className="h-8 w-8" />}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{getName(cat)}</h1>
            <p className="text-sm text-emerald-600 mt-2">{cat.listingCount} {t(locale, 'common.results')}</p>
          </div>

          {cat.children && cat.children.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t(locale, 'categories.subcategories')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {cat.children.map(sub => (
                  <Link key={sub.id} href={`/${locale}/search?category=${sub.slug}`}
                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all">
                    <h3 className="font-medium text-slate-900">{getName(sub)}</h3>
                    <p className="text-sm text-slate-500 mt-1">{sub.listingCount} {t(locale, 'common.results')}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href={`/${locale}/search?category=${cat.slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
            {t(locale, 'common.viewAll')} {getName(cat)}
            <ChevronRight className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
          </Link>
        </>
      )}
    </div>
  );
}
