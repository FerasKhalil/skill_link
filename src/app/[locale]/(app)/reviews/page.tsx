'use client';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { t } from '@/i18n';
import { reviewsApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Star, Loader2 } from 'lucide-react';

export default function ReviewsPage() {
  const { locale, user, showToast } = useApp();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [providerId, setProviderId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewsApi.list({ mine: 'true' });
      setReviews(res.data || []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchReviews(); }, [fetchReviews]);

  const handleSubmit = async () => {
    if (!rating || !providerId) {
      showToast('Please provide a rating and provider ID', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await reviewsApi.create({ providerId, rating, title: title || undefined, content: content || undefined });
      showToast(t(locale, 'reviews.form.success'), 'success');
      setShowForm(false);
      setRating(0);
      setTitle('');
      setContent('');
      setProviderId('');
      fetchReviews();
    } catch (e: any) {
      showToast(e.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t(locale, 'reviews.title')}</h1>
        <Button onClick={() => setShowForm(!showForm)}><Star className="h-4 w-4 mr-1" />{t(locale, 'reviews.writeReview')}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <Input label="Provider ID" placeholder="Enter provider profile ID" value={providerId} onChange={e => setProviderId(e.target.value)} fullWidth />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t(locale, 'reviews.form.rating')}</label>
              <StarRating rating={rating} interactive onChange={setRating} size="lg" />
            </div>
            <Input label={t(locale, 'reviews.form.title') || 'Title'} value={title} onChange={e => setTitle(e.target.value)} fullWidth />
            <Textarea label={t(locale, 'reviews.form.review')} placeholder={t(locale, 'reviews.form.reviewPlaceholder')}
              value={content} onChange={e => setContent(e.target.value)} fullWidth />
            <Button onClick={handleSubmit} disabled={submitting || !rating || !providerId}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {t(locale, 'reviews.form.submit')}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No reviews yet</p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Star className="h-4 w-4 mr-1" />{t(locale, 'reviews.writeReview')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev: any) => (
            <Card key={rev.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium shrink-0">
                    {user?.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">{user?.displayName || 'You'}</span>
                      <StarRating rating={rev.rating} size="sm" />
                      <Badge variant={rev.provenance === 'booking_verified' ? 'success' : 'outline'} size="sm">
                        {rev.provenance === 'booking_verified' ? t(locale, 'reviews.bookingVerified') : t(locale, 'reviews.experienceUnverified')}
                      </Badge>
                    </div>
                    {rev.title && <p className="font-medium text-slate-700 text-sm">{rev.title}</p>}
                    <p className="text-sm text-slate-600 mt-1">{rev.content}</p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(rev.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
