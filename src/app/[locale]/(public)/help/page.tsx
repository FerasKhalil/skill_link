'use client';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { HelpCircle, Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  { key: 'howToBook' },
  { key: 'howToBecomeProvider' },
  { key: 'paymentMethods' },
  { key: 'cancellationPolicy' },
  { key: 'accountSecurity' },
  { key: 'contactSupport' },
];

export default function HelpPage() {
  const { locale } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="mb-8 text-center">
        <HelpCircle className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t(locale, 'help.title')}</h1>
        <p className="text-slate-500">{t(locale, 'help.subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t(locale, 'help.searchPlaceholder')}
            className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-medium text-slate-900">{t(locale, `help.faqs.${faq.key}.question`)}</span>
              <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
            </button>
            {openFaq === i && (
              <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">
                {t(locale, `help.faqs.${faq.key}.answer`)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
