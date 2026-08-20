'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { bookingsApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, X, Loader2 } from 'lucide-react';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { locale, showToast } = useApp();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    params.then(p => {
      bookingsApi.get(p.id)
        .then(r => setBooking(r.data))
        .catch(e => showToast(e.message || 'Failed to load booking', 'error'))
        .finally(() => setLoading(false));
    });
  }, [params, showToast]);

  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      await bookingsApi.update(booking.id, { state: 'cancelled' });
      setBooking((prev: any) => ({ ...prev, state: 'cancelled' }));
      showToast('Booking cancelled', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
        <p className="text-center text-slate-500 py-20">Booking not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
      <Link href={`/${locale}/bookings`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} /> {t(locale, 'common.back')}
      </Link>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{booking.title || 'Booking'}</h1>
              {booking.customerDisplayName && <p className="text-slate-500">{booking.customerDisplayName}</p>}
            </div>
            <Badge variant={booking.state === 'confirmed' ? 'success' : booking.state === 'completed' ? 'success' : booking.state === 'pending' ? 'warning' : 'default'}>
              {booking.state}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {booking.scheduledDate && (
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs font-medium text-slate-400 mb-1">{t(locale, 'bookings.date')}</p>
                <p className="text-sm font-medium text-slate-900">{formatDate(booking.scheduledDate, locale)}</p>
              </div>
            )}
            {booking.scheduledTime && (
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs font-medium text-slate-400 mb-1">{t(locale, 'bookings.time')}</p>
                <p className="text-sm font-medium text-slate-900">{booking.scheduledTime}</p>
              </div>
            )}
            {booking.deliveryMode && (
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs font-medium text-slate-400 mb-1">{t(locale, 'bookings.location')}</p>
                <p className="text-sm font-medium text-slate-900">{booking.deliveryMode}</p>
              </div>
            )}
            {booking.price && (
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs font-medium text-slate-400 mb-1">Price</p>
                <p className="text-sm font-medium text-slate-900">{booking.price} {booking.currency || 'JOD'}</p>
              </div>
            )}
          </div>

          {booking.description && (
            <div className="p-3 rounded-lg bg-slate-50">
              <p className="text-xs font-medium text-slate-400 mb-1">Description</p>
              <p className="text-sm text-slate-700">{booking.description}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            {booking.state === 'confirmed' && (
              <button disabled={cancelling} onClick={handleCancel}
                className="flex items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                {t(locale, 'bookings.actions.cancel')}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
