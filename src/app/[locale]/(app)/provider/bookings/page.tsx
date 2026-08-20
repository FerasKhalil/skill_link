'use client';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { bookingsApi } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Check, X, Loader2, ArrowLeft } from 'lucide-react';

export default function ProviderBookingsPage() {
  const { locale, showToast } = useApp();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list({ limit: '50' });
      setBookings(res.data || []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchBookings(); }, [fetchBookings]);

  const handleAction = async (id: string, state: string) => {
    setActionId(id);
    try {
      await bookingsApi.update(id, { state });
      showToast(`Booking ${state}`, 'success');
      fetchBookings();
    } catch (e: any) {
      showToast(e.message || 'Failed to update booking', 'error');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      <Link href={`/${locale}/provider/workspace`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} /> Back to Workspace
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t(locale, 'providerWorkspace.bookings')}</h1>
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">No bookings yet</p>
          <Link href={`/${locale}/provider/services`}>
            <Button size="sm">Manage Services</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking: any) => (
            <div key={booking.id} className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{booking.title || 'Booking'}</p>
                  <p className="text-sm text-slate-500">{booking.customerDisplayName || 'Customer'}</p>
                  {booking.scheduledDate && (
                    <p className="text-xs text-slate-400 mt-1">{formatDate(booking.scheduledDate, locale)} {booking.scheduledTime || ''}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={booking.state === 'confirmed' ? 'success' : booking.state === 'pending' ? 'warning' : 'default'}>
                    {booking.state}
                  </Badge>
                  {booking.state === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" disabled={actionId === booking.id} onClick={() => handleAction(booking.id, 'confirmed')}>
                        {actionId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="danger" disabled={actionId === booking.id} onClick={() => handleAction(booking.id, 'cancelled')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
