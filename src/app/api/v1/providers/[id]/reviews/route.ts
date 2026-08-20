import { NextRequest } from 'next/server';
import { getDb, providerProfiles, reviews, users, bookings } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiUnauthorized,
  parseJsonBody,
  getPaginationParams,
  paginatedResponse,
} from '@/lib/api-helpers';
import { z } from 'zod';

const reviewSchema = z.object({
  bookingId: z.string().uuid().optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  title: z.string().max(300).optional(),
  content: z.string().min(1, 'Review content is required').max(2000),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);

    const [provider] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, id))
      .limit(1);

    if (!provider) return apiNotFound('Provider not found');

    const conditions = [
      eq(reviews.providerId, id),
      eq(reviews.isHidden, false),
    ];

    const results = await db
      .select({
        id: reviews.id,
        reviewerId: reviews.reviewerId,
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
  } catch (error) {
    console.error('List reviews error:', error);
    return apiError('Failed to list reviews', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser) return apiUnauthorized();

    const { id } = await params;
    const db = getDb();

    const [provider] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, id))
      .limit(1);

    if (!provider) return apiNotFound('Provider not found');

    if (provider.userId === authUser.id) {
      return apiError('You cannot review yourself', 400);
    }

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const data = parsed.data;

    if (data.bookingId) {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.id, data.bookingId),
            eq(bookings.customerId, authUser.id),
            eq(bookings.providerId, id),
            eq(bookings.state, 'completed')
          )
        )
        .limit(1);

      if (!booking) {
        return apiError('Invalid booking for review', 400);
      }

      const [existingReview] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.bookingId, data.bookingId))
        .limit(1);

      if (existingReview) {
        return apiError('A review already exists for this booking', 409);
      }
    }

    const provenance = data.bookingId ? 'booking_verified' : 'experience_unverified';

    const [review] = await db
      .insert(reviews)
      .values({
        reviewerId: authUser.id,
        providerId: id,
        bookingId: data.bookingId || null,
        rating: data.rating,
        title: data.title || null,
        content: data.content,
        provenance,
      })
      .returning();

    const [{ count: totalReviews }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(and(eq(reviews.providerId, id), eq(reviews.isHidden, false)));

    const [{ avgRating }] = await db
      .select({ avgRating: sql<string>`COALESCE(AVG(${reviews.rating}), 0)::text` })
      .from(reviews)
      .where(and(eq(reviews.providerId, id), eq(reviews.isHidden, false)));

    await db
      .update(providerProfiles)
      .set({
        ratingAvg: avgRating,
        ratingCount: totalReviews,
        updatedAt: new Date(),
      })
      .where(eq(providerProfiles.id, id));

    return apiSuccess(review, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Submit review error:', error);
    return apiError('Failed to submit review', 500);
  }
}
