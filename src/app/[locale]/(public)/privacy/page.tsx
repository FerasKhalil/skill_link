'use client';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';

export default function PrivacyPage() {
  const { locale } = useApp();
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t(locale, 'footer.privacyPolicy')}</h1>
      <p className="text-sm text-slate-400 mb-8">{t(locale, 'legal.lastUpdated')}</p>
      <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.privacy.collection.title')}</h2>
          <p>{t(locale, 'legal.privacy.collection.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.privacy.usage.title')}</h2>
          <p>{t(locale, 'legal.privacy.usage.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.privacy.sharing.title')}</h2>
          <p>{t(locale, 'legal.privacy.sharing.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.privacy.security.title')}</h2>
          <p>{t(locale, 'legal.privacy.security.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.privacy.rights.title')}</h2>
          <p>{t(locale, 'legal.privacy.rights.content')}</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{t(locale, 'legal.privacy.contact.title')}</h2>
          <p>{t(locale, 'legal.privacy.contact.content')}</p>
        </section>
      </div>
    </div>
  );
}
