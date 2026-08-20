'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { bookingsApi, conversationsApi, savedApi, providersApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageCircle, Bookmark, ChevronRight, Star, Eye, Briefcase, CheckCircle, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { locale, user } = useApp();

  if (!user) return null;

  if (user.role === 'provider') {
    return <ProviderDashboard />;
  }
  return <CustomerDashboard />;
}

/* ─── Customer Dashboard ──────────────────────────── */
function CustomerDashboard() {
  const { locale, user } = useApp();
  const [bookings, setBookings] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [topProviders, setTopProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        await Promise.allSettled([
          bookingsApi.list({ limit: '5' }).then(r => { if (!cancelled) setBookings(r.data || []); }),
          conversationsApi.list().then(r => { if (!cancelled) setConversations(r.data || []); }),
          savedApi.list().then(r => { if (!cancelled) setSavedCount(r.data?.length || 0); }),
          providersApi.list({ featured: 'true', limit: '3' }).then(r => { if (!cancelled) setTopProviders(r.data || []); }),
        ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {t(locale, 'common.welcome')}, {user.displayName || user.firstName}!
        </h1>
        <p className="text-slate-500">Find and book trusted service providers</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href={`/${locale}/bookings`}>
              <Card hover>
                <CardContent className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Calendar className="h-6 w-6" /></div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{bookings.length}</p>
                    <p className="text-sm text-slate-500">{t(locale, 'nav.bookings')}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/${locale}/messages`}>
              <Card hover>
                <CardContent className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><MessageCircle className="h-6 w-6" /></div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{conversations.length}</p>
                    <p className="text-sm text-slate-500">{t(locale, 'nav.messages')}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/${locale}/saved`}>
              <Card hover>
                <CardContent className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Bookmark className="h-6 w-6" /></div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{savedCount}</p>
                    <p className="text-sm text-slate-500">{t(locale, 'nav.saved')}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>{t(locale, 'nav.bookings')}</CardTitle></CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-slate-500 text-sm mb-2">No bookings yet</p>
                    <Link href={`/${locale}/search`} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Find a provider</Link>
                  </div>
                ) : bookings.slice(0, 4).map((booking: any) => (
                  <Link key={booking.id} href={`/${locale}/bookings/${booking.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{booking.title || 'Booking'}</p>
                      <p className="text-xs text-slate-500">{booking.scheduledDate || new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={booking.state === 'confirmed' ? 'success' : booking.state === 'completed' ? 'success' : booking.state === 'pending' ? 'warning' : 'default'} size="sm">
                      {booking.state}
                    </Badge>
                  </Link>
                ))}
                {bookings.length > 0 && (
                  <Link href={`/${locale}/bookings`}
                    className="flex items-center justify-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 mt-3 py-2">
                    {t(locale, 'common.viewAll')} <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t(locale, 'nav.messages')}</CardTitle></CardHeader>
              <CardContent>
                {conversations.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-slate-500 text-sm mb-2">No conversations yet</p>
                    <Link href={`/${locale}/search`} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Find a provider to message</Link>
                  </div>
                ) : conversations.slice(0, 4).map((conv: any) => (
                  <Link key={conv.id} href={`/${locale}/messages/${conv.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium shrink-0">
                      {conv.otherUser?.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{conv.otherUser?.displayName || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{conv.lastMessagePreview || 'No messages'}</p>
                    </div>
                    {conv.unreadCount > 0 && <span className="bg-emerald-600 text-white rounded-full px-1.5 py-0.5 text-xs">{conv.unreadCount}</span>}
                  </Link>
                ))}
                {conversations.length > 0 && (
                  <Link href={`/${locale}/messages`}
                    className="flex items-center justify-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 mt-3 py-2">
                    {t(locale, 'common.viewAll')} <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {topProviders.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">{t(locale, 'home.topProviders')}</h2>
                <Link href={`/${locale}/search`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">{t(locale, 'common.viewAll')}</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topProviders.map((provider: any) => (
                  <Link key={provider.id} href={`/${locale}/providers/${provider.id}`}
                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all bg-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                        {provider.userDisplayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{provider.userDisplayName}</p>
                        <p className="text-xs text-slate-500 truncate">{provider.profession || provider.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{provider.ratingAvg || '0.0'}</span>
                      <span className="text-xs text-slate-400">({provider.ratingCount || 0})</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 p-6 rounded-xl border border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-900">Want to offer your own services?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-3">Join SkillLink as a provider and start earning by offering your skills to customers.</p>
            <Link href={`/${locale}/become-provider`}
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Become a Provider <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Provider Dashboard ──────────────────────────── */
function ProviderDashboard() {
  const { locale, user, providerProfile } = useApp();
  const [stats, setStats] = useState({ views: 0, messages: 0, bookings: 0, rating: 'N/A' });
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!providerProfile) { setLoading(false); return; }
      setLoading(true);
      try {
        await Promise.allSettled([
          providersApi.get(providerProfile.id).then(r => {
            if (cancelled) return;
            const d = r.data;
            setStats({
              views: d.viewCount || 0,
              messages: 0,
              bookings: d.bookingCount || 0,
              rating: d.ratingAvg || 'N/A',
            });
          }),
          bookingsApi.list({ status: 'pending', limit: '5' }).then(r => { if (!cancelled) setPendingBookings(r.data || []); }),
          conversationsApi.list().then(r => {
            if (cancelled) return;
            const convs = r.data || [];
            setRecentConversations(convs.slice(0, 4));
            setStats(prev => ({ ...prev, messages: convs.length }));
          }),
        ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [providerProfile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleBooking = async (bookingId: string, action: 'confirmed' | 'cancelled') => {
    try {
      await bookingsApi.update(bookingId, { state: action });
      setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
      setStats(prev => ({ ...prev, bookings: prev.bookings + (action === 'confirmed' ? 1 : 0) }));
    } catch {}
  };

  const quickLinks = [
    { label: 'My Services', href: `/${locale}/provider/services`, icon: Briefcase },
    { label: 'Bookings', href: `/${locale}/provider/bookings`, icon: Calendar },
    { label: 'Messages', href: `/${locale}/provider/messages`, icon: MessageCircle },
    { label: 'Settings', href: `/${locale}/provider/settings`, icon: Eye },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {t(locale, 'common.welcome')}, {user?.displayName || user?.firstName}!
        </h1>
        <p className="text-slate-500">Manage your services and bookings</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Profile Views', value: stats.views, icon: Eye, color: 'bg-blue-50 text-blue-600' },
              { label: 'Messages', value: stats.messages, icon: MessageCircle, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Bookings', value: stats.bookings, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
              { label: 'Rating', value: stats.rating, icon: Star, color: 'bg-amber-50 text-amber-600' },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pending Bookings</CardTitle>
                  <Link href={`/${locale}/provider/bookings`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">View all</Link>
                </div>
              </CardHeader>
              <CardContent>
                {pendingBookings.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No pending bookings</p>
                  </div>
                ) : pendingBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{booking.title || 'Booking request'}</p>
                      <p className="text-xs text-slate-500">{booking.scheduledDate || 'Date TBD'} {booking.price ? `— ${booking.price} JOD` : ''}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleBooking(booking.id, 'confirmed')}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
                        Accept
                      </button>
                      <button onClick={() => handleBooking(booking.id, 'cancelled')}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Messages</CardTitle>
                  <Link href={`/${locale}/provider/messages`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">View all</Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentConversations.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-6">No messages yet</p>
                ) : recentConversations.map((conv: any) => (
                  <Link key={conv.id} href={`/${locale}/provider/messages`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium shrink-0">
                      {conv.otherUser?.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{conv.otherUser?.displayName || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{conv.lastMessagePreview || 'No messages'}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickLinks.map((link, i) => (
                  <Link key={i} href={link.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                    <link.icon className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{link.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
