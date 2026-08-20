'use client';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const { locale } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t(locale, 'contact.title')}</h1>
        <p className="text-slate-500">{t(locale, 'contact.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <Mail className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">{t(locale, 'contact.email')}</h3>
          <p className="text-sm text-slate-500">support@skillink.jo</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <Phone className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">{t(locale, 'contact.phone')}</h3>
          <p className="text-sm text-slate-500">+962 7 0000 0000</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <MapPin className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 mb-1">{t(locale, 'contact.location')}</h3>
          <p className="text-sm text-slate-500">Amman, Jordan</p>
        </div>
      </div>

      {submitted ? (
        <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-emerald-800 mb-2">{t(locale, 'contact.thankYou')}</h2>
          <p className="text-emerald-700">{t(locale, 'contact.responseMessage')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(locale, 'contact.name')}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(locale, 'contact.emailLabel')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(locale, 'contact.subject')}</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t(locale, 'contact.message')}</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-emerald-600 text-white py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors">
            {t(locale, 'contact.sendMessage')}
          </button>
        </form>
      )}
    </div>
  );
}
