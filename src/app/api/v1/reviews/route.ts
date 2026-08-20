import { NextRequest } from 'next/server';
import { getDb, reviews, providerProfiles, bookings, users } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  parseJsonBody,
  getPaginationParams,
  paginatedResponse,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const mine = searchParams.get('mine');
    const { page, limit, offset } = getPaginationParams(request);

    if (mine === 'true') {
      const user = await getCurrentUser(request);
      if (!user) return apiUnauthorized();

      const conditions = [
        eq(reviews.reviewerId, user.id),
        eq(reviews.isHidden, false),
      ];

      const results = await db
        .select({
          id: reviews.id,
          reviewerId: reviews.reviewerId,
          providerId: reviews.providerId,
          bookingId: reviews.bookingId,
          rating: reviews.rating,
          title: reviews.title,
          content: reviews.content,
          provenance: reviews.provenance,
          isEdited: reviews.isEdited,
          editedAt: reviews.editedAt,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
        })
        .from(reviews)
        .where(and(...conditions))
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(and(...conditions));

      return paginatedResponse(results, count, page, limit);
    }

    if (providerId) {
      const [provider] = await db
        .select()
        .from(providerProfiles)
        .where(eq(providerProfiles.id, providerId))
        .limit(1);
      if (!provider) return apiNotFound('Provider not found');

      const conditions = [
        eq(reviews.providerId, providerId),
        eq(reviews.isHidden, false),
      ];

      const results = await db
        .select({
          id: reviews.id,
          reviewerId: reviews.reviewerId,
          providerId: reviews.providerId,
          bookingId: reviews.bookingId,
          rating: reviews.rating,
          title: reviews.title,
          content: reviews.content,
          provenance: reviews.provenance,
          isEdited: reviews.isEdited,
          createdAt: reviews.createdAt,
          reviewerFirstName: users.firstName,
          reviewerLastName: users.lastName,
          reviewerDisplayName: users.displayName,
          reviewerAvatarUrl: users.avatarUrl,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.reviewerId, users.id))
        .where(and(...conditions))
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(and(...conditions));

      return paginatedResponse(results, count, page, limit);
    }

    return apiError('providerId query parameter is required');
  } catch (error) {
    console.error('List reviews error:', error);
    return apiError('Failed to list reviews', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { providerId, bookingId, rating, title, content } = body as {
      providerId?: string;
      bookingId?: string;
      rating?: number;
      title?: string;
      content?: string;
    };

    if (!providerId) return apiError('providerId is required');
    if (rating === undefined || rating === null) return apiError('rating is required');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return apiError('rating must be an integer between 1 and 5');
    }

    const db = getDb();

    const [provider] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, providerId))
      .limit(1);
    if (!provider) return apiNotFound('Provider not found');

    if (provider.userId === authUser.id) {
      return apiError('You cannot review yourself');
    }

    if (bookingId) {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.id, bookingId),
            eq(bookings.customerId, authUser.id),
            eq(bookings.providerId, providerId),
            eq(bookings.state, 'completed'),
          ),
        )
        .limit(1);

      if (!booking) {
        return apiError('Invalid booking for review');
      }

      const [existingReview] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.bookingId, bookingId))
        .limit(1);

      if (existingReview) {
        return apiError('A review already exists for this booking', 409);
      }
    }

    const provenance = bookingId ? 'booking_verified' : 'experience_unverified';

    const [review] = await db
      .insert(reviews)
      .values({
        reviewerId: authUser.id,
        providerId,
        bookingId: bookingId || null,
        rating,
        title: title || null,
        content: content || null,
        provenance,
      })
      .returning();

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

    return apiSuccess(review, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Create review error:', error);
    return apiError('Failed to create review', 500);
  }
}
