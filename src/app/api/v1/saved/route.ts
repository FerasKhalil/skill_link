import { NextRequest } from 'next/server';
import { getDb, savedProviders, providerProfiles, users } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  getPaginationParams,
  paginatedResponse,
  parseJsonBody,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(savedProviders)
      .where(eq(savedProviders.userId, user.id));

    const total = countResult?.count ?? 0;

    const results = await db
      .select({
        id: savedProviders.id,
        createdAt: savedProviders.createdAt,
        provider: {
          id: providerProfiles.id,
          profession: providerProfiles.profession,
          title: providerProfiles.title,
          bio: providerProfiles.bio,
          ratingAvg: providerProfiles.ratingAvg,
          ratingCount: providerProfiles.ratingCount,
          bookingCount: providerProfiles.bookingCount,
          verificationStatus: providerProfiles.verificationStatus,
          locationCity: providerProfiles.locationCity,
        },
        user: {
          id: users.id,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
        listingCount: sql<number>`(
          SELECT count(*)::int FROM listings l
          WHERE l.provider_id = ${providerProfiles.id} AND l.status = 'active'
        )`,
      })
      .from(savedProviders)
      .innerJoin(providerProfiles, eq(savedProviders.providerId, providerProfiles.id))
      .innerJoin(users, eq(providerProfiles.userId, users.id))
      .where(eq(savedProviders.userId, user.id))
      .orderBy(desc(savedProviders.createdAt))
      .limit(limit)
      .offset(offset);

    return paginatedResponse(results, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return apiError('Authentication required', 401);
    }
    console.error('Saved providers list error:', error);
    return apiError('Failed to fetch saved providers', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request);

    if (!body) {
      return apiError('Invalid request body');
    }

    const { providerId } = body;

    if (!providerId || typeof providerId !== 'string') {
      return apiError('providerId is required');
    }

    const db = getDb();

    const [provider] = await db
      .select({ id: providerProfiles.id })
      .from(providerProfiles)
      .where(eq(providerProfiles.id, providerId))
      .limit(1);

    if (!provider) {
      return apiError('Provider not found', 404);
    }

    const [existing] = await db
      .select({ id: savedProviders.id })
      .from(savedProviders)
      .where(and(eq(savedProviders.userId, user.id), eq(savedProviders.providerId, providerId)))
      .limit(1);

    if (existing) {
      return apiSuccess({ id: existing.id, message: 'Already saved' });
    }

    const [saved] = await db
      .insert(savedProviders)
      .values({
        userId: user.id,
        providerId,
      })
      .returning({ id: savedProviders.id, createdAt: savedProviders.createdAt });

    return apiSuccess(saved, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return apiError('Authentication required', 401);
    }
    console.error('Save provider error:', error);
    return apiError('Failed to save provider', 500);
  }
}
