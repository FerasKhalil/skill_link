'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { categoriesApi } from '@/lib/api-client';


export function Footer() {
  const { locale } = useApp();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    categoriesApi.list()
      .then(r => setCategories(r.data || []))
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg">S</div>
              <span className="text-xl font-bold text-slate-900">SkillLink</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">{t(locale, 'footer.aboutText')}</p>
            <p className="text-sm text-slate-500 mt-3 flex items-center gap-1">
              {t(locale, 'footer.madeInJordan')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">{t(locale, 'footer.categories')}</h4>
            <ul className="space-y-2">
              {categories.filter((c: any) => !c.parentId).map((cat: any) => (
                <li key={cat.id}>
                  <Link href={`/${locale}/categories/${cat.slug}`}
                    className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">
                    {locale === 'ar' ? cat.nameAr : cat.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">{t(locale, 'footer.support')}</h4>
            <ul className="space-y-2">
              <li><Link href={`/${locale}/help`} className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">{t(locale, 'footer.helpCenter')}</Link></li>
              <li><Link href={`/${locale}/contact`} className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">{t(locale, 'footer.contactUs')}</Link></li>
              <li><Link href={`/${locale}/report`} className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">{t(locale, 'footer.reportIssue')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">{t(locale, 'footer.legal')}</h4>
            <ul className="space-y-2">
              <li><Link href={`/${locale}/terms`} className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">{t(locale, 'footer.termsOfService')}</Link></li>
              <li><Link href={`/${locale}/privacy`} className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">{t(locale, 'footer.privacyPolicy')}</Link></li>
              <li><Link href={`/${locale}/cookies`} className="text-sm text-slate-500 hover:text-emerald-600 transition-colors">{t(locale, 'footer.cookiePolicy')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">{t(locale, 'footer.copyright')}</p>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/become-provider`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              {t(locale, 'nav.becomeProvider')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
