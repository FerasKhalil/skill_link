'use client';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { useState } from 'react';
import { Flag } from 'lucide-react';

export default function ReportPage() {
  const { locale } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <div className="mb-8 text-center">
        <Flag className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t(locale, 'report.title')}</h1>
        <p className="text-slate-500">{t(locale, 'report.subtitle')}</p>
      </div>

      {submitted ? (
        <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-emerald-800 mb-2">{t(locale, 'report.thankYou')}</h2>
          <p className="text-emerald-700">{t(locale, 'report.followUp')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(locale, 'report.reason')}</label>
            <select value={reason} onChange={e => setReason(e.target.value)} required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
              <option value="">{t(locale, 'report.selectReason')}</option>
              <option value="spam">{t(locale, 'report.reasons.spam')}</option>
              <option value="inappropriate">{t(locale, 'report.reasons.inappropriate')}</option>
              <option value="fraud">{t(locale, 'report.reasons.fraud')}</option>
              <option value="harassment">{t(locale, 'report.reasons.harassment')}</option>
              <option value="fake_profile">{t(locale, 'report.reasons.fakeProfile')}</option>
              <option value="other">{t(locale, 'report.reasons.other')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(locale, 'report.details')}</label>
            <textarea value={details} onChange={e => setDetails(e.target.value)} required rows={5}
              placeholder={t(locale, 'report.detailsPlaceholder')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-emerald-600 text-white py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors">
            {t(locale, 'report.submit')}
          </button>
        </form>
      )}
    </div>
  );
}
