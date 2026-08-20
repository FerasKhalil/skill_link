'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { providersApi, conversationsApi, savedApi, reviewsApi } from '@/lib/api-client';
import { StarRating } from '@/components/ui/star-rating';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, MapPin, Clock, MessageCircle, Bookmark, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';

export default function ProviderProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { locale, user, showToast } = useApp();
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('services');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    params.then(p => {
      const id = p.slug;
      setProviderId(id);
      setLoading(true);
      Promise.allSettled([
        providersApi.get(id).then(r => setProvider(r.data)),
        providersApi.getListings(id).then(r => setListings(r.data || [])),
        providersApi.getReviews(id).then(r => setReviews(r.data || [])),
        user ? savedApi.list().then(r => {
          const isSaved = (r.data || []).some((s: any) => s.providerId === id);
          setSaved(isSaved);
        }) : Promise.resolve(),
      ]).finally(() => setLoading(false));
    });
  }, [params, user]);

  const handleStartConversation = async () => {
    if (!user) { showToast('Please log in to message', 'error'); return; }
    try {
      const res = await conversationsApi.create({ providerId, listingId: listings[0]?.id });
      router.push(`/${locale}/messages/${res.data.id}`);
    } catch (e: any) {
      showToast(e.message || 'Failed to start conversation', 'error');
    }
  };

  const handleToggleSave = async () => {
    if (!user) { showToast('Please log in to save providers', 'error'); return; }
    try {
      if (saved) {
        await savedApi.unsave(providerId);
        setSaved(false);
        showToast('Provider removed from saved', 'success');
      } else {
        await savedApi.save(providerId);
        setSaved(true);
        showToast('Provider saved', 'success');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to save provider', 'error');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { showToast('Please log in to leave a review', 'error'); return; }
    if (reviewRating === 0) { showToast('Please select a rating', 'error'); return; }
    setSubmittingReview(true);
    try {
      await reviewsApi.create({
        providerId,
        rating: reviewRating,
        title: reviewTitle || undefined,
        content: reviewContent || undefined,
      });
      showToast('Review submitted', 'success');
      setReviewRating(0);
      setReviewTitle('');
      setReviewContent('');
      const r = await providersApi.getReviews(providerId);
      setReviews(r.data || []);
    } catch (e: any) {
      showToast(e.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        <div className="text-center py-20 text-slate-500">Provider not found</div>
      </div>
    );
  }

  const displayName = provider.userDisplayName || `${provider.userFirstName || ''} ${provider.userLastName || ''}`.trim() || 'Provider';

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href={`/${locale}/search`} className="hover:text-emerald-600">{t(locale, 'common.search')}</Link>
        <ChevronRight className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
        <span className="text-slate-900 font-medium">{displayName}</span>
      </div>

      <div className="p-6 rounded-2xl border border-slate-200 bg-white mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xl shrink-0">
            {displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                <p className="text-slate-500">{provider.profession || provider.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleToggleSave}>
                  <Bookmark className={`h-4 w-4 ${saved ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {provider.ratingAvg && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={parseFloat(provider.ratingAvg) || 0} size="sm" showValue />
                  <span className="text-sm text-slate-400">({provider.ratingCount || 0} {t(locale, 'common.reviews')})</span>
                </div>
              )}
              {provider.locationCity && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  {provider.locationCity}{provider.locationGovernorate ? `, ${provider.locationGovernorate}` : ''}
                </div>
              )}
              {provider.responseTime && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  {provider.responseTime}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {provider.identityVerified && (
                <Badge variant="success" size="sm"><Shield className="h-3 w-3" />{t(locale, 'provider.verifiedIdentity')}</Badge>
              )}
              {provider.verificationStatus === 'approved' && (
                <Badge variant="info" size="sm"><CheckCircle className="h-3 w-3" />Verified Provider</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
          <button onClick={handleStartConversation}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
            <MessageCircle className="h-4 w-4" />
            {t(locale, 'provider.chatWithProvider', { name: displayName.split(' ')[0] })}
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-0 overflow-x-auto">
          {[
            { id: 'services', label: t(locale, 'provider.services') },
            { id: 'reviews', label: `${t(locale, 'provider.reviews')} (${reviews.length})` },
            { id: 'about', label: t(locale, 'provider.about') },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'services' && (
        <div className="space-y-4">
          {listings.length === 0 ? (
            <p className="text-center text-slate-500 py-8">{t(locale, 'provider.noServices')}</p>
          ) : listings.map((listing: any) => (
            <div key={listing.id} className="p-5 rounded-xl border border-slate-200 bg-white">
              <h3 className="font-semibold text-slate-900 mb-1">{locale === 'ar' ? listing.titleAr : listing.titleEn}</h3>
              <p className="text-sm text-slate-500 mb-3">{locale === 'ar' ? listing.descriptionAr : listing.descriptionEn}</p>
              <div className="flex flex-wrap gap-2">
                {listing.priceMin && (
                  <span className="text-emerald-600 font-semibold text-sm">
                    {listing.priceMin}{listing.priceMax ? ` - ${listing.priceMax}` : ''} {listing.currency || 'JOD'}
                  </span>
                )}
                <Badge variant="outline" size="sm">{listing.pricingModel}</Badge>
                <Badge variant={listing.status === 'active' ? 'success' : 'default'} size="sm">{listing.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {user && user.id !== provider.userId && (
            <div className="p-5 rounded-xl border border-slate-200 bg-white">
              <h3 className="font-semibold text-slate-900 mb-4">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                  <StarRating rating={reviewRating} interactive onChange={setReviewRating} size="lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title (optional)</label>
                  <input type="text" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)}
                    placeholder="Summary of your experience"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Review (optional)</label>
                  <textarea value={reviewContent} onChange={e => setReviewContent(e.target.value)}
                    placeholder="Tell others about your experience..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none resize-none" />
                </div>
                <button type="submit" disabled={submittingReview || reviewRating === 0}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit Review
                </button>
              </form>
            </div>
          )}
          {reviews.length === 0 ? (
            <p className="text-center text-slate-500 py-8">{t(locale, 'provider.noReviews')}</p>
          ) : reviews.map((review: any) => (
            <div key={review.id} className="p-5 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600 shrink-0">
                  {review.reviewerDisplayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">{review.reviewerDisplayName || 'User'}</span>
                    <StarRating rating={review.rating} size="sm" />
                    <Badge variant={review.provenance === 'booking_verified' ? 'success' : 'outline'} size="sm">
                      {review.provenance === 'booking_verified' ? t(locale, 'reviews.bookingVerified') : t(locale, 'reviews.experienceUnverified')}
                    </Badge>
                  </div>
                  {review.title && <p className="font-medium text-slate-700 text-sm">{review.title}</p>}
                  <p className="text-sm text-slate-600 mt-1">{review.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-slate-200 bg-white">
            <h3 className="font-semibold text-slate-900 mb-2">{t(locale, 'provider.about')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{provider.bio || 'No bio provided'}</p>
          </div>
          {provider.experience && (
            <div className="p-5 rounded-xl border border-slate-200 bg-white">
              <h3 className="font-semibold text-slate-900 mb-2">{t(locale, 'provider.experience')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{provider.experience}</p>
            </div>
          )}
          {provider.locationCity && (
            <div className="p-5 rounded-xl border border-slate-200 bg-white">
              <h3 className="font-semibold text-slate-900 mb-2">{t(locale, 'provider.serviceAreas')}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4" />
                {provider.locationCity}{provider.locationGovernorate ? `, ${provider.locationGovernorate}` : ''}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
