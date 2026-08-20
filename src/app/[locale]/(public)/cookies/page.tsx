'use client';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';

export default function CookiesPage() {
  const { locale } = useApp();
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t(locale, 'footer.cookiePolicy')}</h1>
      <p className="text-sm text-slate-400 mb-8">{t(locale, 'legal.lastUpdated')}</p>
      <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.cookies.what.title')}</h2>
          <p>{t(locale, 'legal.cookies.what.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.cookies.types.title')}</h2>
          <p>{t(locale, 'legal.cookies.types.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.cookies.usage.title')}</h2>
          <p>{t(locale, 'legal.cookies.usage.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.cookies.management.title')}</h2>
          <p>{t(locale, 'legal.cookies.management.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.cookies.contact.title')}</h2>
          <p>{t(locale, 'legal.cookies.contact.content')}</p>
        </section>
      </div>
    </div>
  );
}
