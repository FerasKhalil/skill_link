'use client';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { mockCategories } from '@/data/mock';
import { BookOpen, Wrench, Music, ChevronRight } from 'lucide-react';

const icons: Record<string, React.ReactNode> = {
  'book-open': <BookOpen className="h-8 w-8" />,
  'wrench': <Wrench className="h-8 w-8" />,
  'music': <Music className="h-8 w-8" />,
};

export default function CategoriesPage() {
  const { locale } = useApp();
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t(locale, 'categories.title')}</h1>
        <p className="text-slate-500">{t(locale, 'categories.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCategories.map(cat => (
          <Link key={cat.id} href={`/${locale}/categories/${cat.slug}`}
            className="group p-6 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all bg-white">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
              {icons[cat.icon || ''] || <BookOpen className="h-8 w-8" />}
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">{cat.name[locale]}</h2>
            <p className="text-sm text-slate-500 mb-4">{cat.description[locale]}</p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-emerald-600">{cat.listingCount} {t(locale, 'common.results')}</span>
              <ChevronRight className={`h-5 w-5 text-slate-400 group-hover:text-emerald-600 ${locale === 'ar' ? 'rotate-180' : ''}`} />
            </div>
            {cat.children && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">{t(locale, 'categories.subcategories')}</p>
                <div className="flex flex-wrap gap-2">
                  {cat.children.map(sub => (
                    <Link key={sub.id} href={`/${locale}/search?category=${sub.slug}`}
                      onClick={e => e.stopPropagation()}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                      {sub.name[locale]}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
