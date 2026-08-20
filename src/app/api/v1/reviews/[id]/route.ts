import { NextRequest } from 'next/server';
import { getDb, reviews, providerProfiles } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  parseJsonBody,
} from '@/lib/api-helpers';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await params;
    const db = getDb();

    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) return apiNotFound('Review not found');

    if (review.reviewerId !== authUser.id) {
      return apiForbidden('You can only edit your own reviews');
    }

    const editDeadline = new Date(review.createdAt.getTime() + EDIT_WINDOW_MS);
    if (new Date() > editDeadline) {
      return apiError('Review edit window has expired (24 hours)');
    }

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { rating, title, content } = body as {
      rating?: number;
      title?: string;
      content?: string;
    };

    if (rating !== undefined) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return apiError('rating must be an integer between 1 and 5');
      }
    }

    const updateData: Record<string, unknown> = {
      isEdited: true,
      editedAt: new Date(),
      updatedAt: new Date(),
    };

    if (rating !== undefined) updateData.rating = rating;
    if (title !== undefined) updateData.title = title || null;
    if (content !== undefined) updateData.content = content || null;

    await db
      .update(reviews)
      .set(updateData)
      .where(eq(reviews.id, id))
      .returning();

    const providerId = review.providerId;

    const [{ count: totalReviews }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(and(eq(reviews.providerId, providerId), eq(reviews.isHidden, false)));

    const [{ avgRating }] = await db
      .select({ avgRating: sql<string>`COALESCE(AVG(${reviews.rating}), 0)::text` })
      .from(reviews)
      .where(and(eq(reviews.providerId, providerId), eq(reviews.isHidden, false)));

    await db
      .update(providerProfiles)
      .set({
        ratingAvg: avgRating,
        ratingCount: totalReviews,
        updatedAt: new Date(),
      })
      .where(eq(providerProfiles.id, providerId));

    return apiSuccess({ id });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Update review error:', error);
    return apiError('Failed to update review', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await params;
    const db = getDb();

    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) return apiNotFound('Review not found');

    const isAdmin = authUser.role === 'admin' || authUser.role === 'moderator';

    if (review.reviewerId !== authUser.id && !isAdmin) {
      return apiForbidden('You can only delete your own reviews');
    }

    await db
      .update(reviews)
      .set({
        content: null,
        rating: 1,
        isHidden: true,
        hiddenBy: authUser.id,
        hiddenAt: new Date(),
        hiddenReason: isAdmin ? 'Removed by admin' : 'Removed by author',
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    const providerId = review.providerId;

    const [{ count: totalReviews }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(and(eq(reviews.providerId, providerId), eq(reviews.isHidden, false)));

    const [{ avgRating }] = await db
      .select({ avgRating: sql<string>`COALESCE(AVG(${reviews.rating}), 0)::text` })
      .from(reviews)
      .where(and(eq(reviews.providerId, providerId), eq(reviews.isHidden, false)));

    await db
      .update(providerProfiles)
      .set({
        ratingAvg: avgRating,
        ratingCount: totalReviews,
        updatedAt: new Date(),
      })
      .where(eq(providerProfiles.id, providerId));

    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Delete review error:', error);
    return apiError('Failed to delete review', 500);
  }
}
