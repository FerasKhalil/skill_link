'use client';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';

export default function TermsPage() {
  const { locale } = useApp();
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t(locale, 'footer.termsOfService')}</h1>
      <p className="text-sm text-slate-400 mb-8">{t(locale, 'legal.lastUpdated')}</p>
      <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.terms.acceptance.title')}</h2>
          <p>{t(locale, 'legal.terms.acceptance.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.terms.services.title')}</h2>
          <p>{t(locale, 'legal.terms.services.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.terms.accounts.title')}</h2>
          <p>{t(locale, 'legal.terms.accounts.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.terms.payments.title')}</h2>
          <p>{t(locale, 'legal.terms.payments.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.terms.liability.title')}</h2>
          <p>{t(locale, 'legal.terms.liability.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.terms.termination.title')}</h2>
          <p>{t(locale, 'legal.terms.termination.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.terms.contact.title')}</h2>
          <p>{t(locale, 'legal.terms.contact.content')}</p>
        </section>
      </div>
    </div>
  );
}
