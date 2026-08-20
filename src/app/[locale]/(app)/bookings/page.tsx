'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { bookingsApi } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Calendar, Clock, ChevronRight, X, Loader2 } from 'lucide-react';

export default function BookingsPage() {
  const { locale, showToast } = useApp();
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async (state?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (state && state !== 'all') params.state = state;
      const res = await bookingsApi.list(params);
      setBookings(res.data || []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchBookings(activeTab); }, [activeTab, fetchBookings]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await bookingsApi.update(id, { state: 'cancelled' });
      showToast('Booking cancelled', 'success');
      fetchBookings(activeTab);
    } catch (e: any) {
      showToast(e.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const tabs = [
    { id: 'all', label: t(locale, 'common.all') },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t(locale, 'bookings.title')}</h1>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{t(locale, 'bookings.noBookings')}</h3>
          <p className="text-slate-500 mb-4">{t(locale, 'bookings.startBooking')}</p>
          <Link href={`/${locale}/search`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
            {t(locale, 'home.hero.cta')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: any) => (
            <div key={booking.id} className="p-5 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{booking.title || 'Booking'}</h3>
                  <p className="text-sm text-slate-500">{booking.customerDisplayName || ''}</p>
                </div>
                <Badge variant={booking.state === 'confirmed' ? 'success' : booking.state === 'completed' ? 'success' : booking.state === 'pending' ? 'warning' : 'default'}>
                  {t(locale, `bookings.states.${booking.state}`)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {booking.scheduledDate && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {formatDate(booking.scheduledDate, locale)}
                  </div>
                )}
                {booking.scheduledTime && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {booking.scheduledTime}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <Link href={`/${locale}/bookings/${booking.id}`}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  {t(locale, 'common.viewProfile')} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                {booking.state === 'confirmed' && (
                  <button
                    disabled={cancellingId === booking.id}
                    onClick={() => handleCancel(booking.id)}
                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 ml-auto disabled:opacity-50">
                    {cancellingId === booking.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    {t(locale, 'bookings.actions.cancel')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
