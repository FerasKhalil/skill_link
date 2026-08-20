import { NextRequest } from 'next/server';
import { getDb, providerProfiles, users } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  getPaginationParams,
  paginatedResponse,
  parseJsonBody,
} from '@/lib/api-helpers';
import { z } from 'zod';

const createProfileSchema = z.object({
  profession: z.string().min(1).max(200),
  title: z.string().max(200).optional(),
  bio: z.string().optional(),
  bioAr: z.string().optional(),
  experience: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  gender: z.string().max(20).optional(),
  locationCity: z.string().max(100).optional(),
  locationGovernorate: z.string().max(100).optional(),
  locationApproximate: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  termsAccepted: z.literal(true, { message: 'You must accept the terms' }),
});

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';

    const conditions = [
      eq(providerProfiles.verificationStatus, 'approved'),
    ];

    const orderClause = featured
      ? [desc(sql`CAST(${providerProfiles.ratingAvg} AS numeric)`), desc(providerProfiles.ratingCount)]
      : [desc(providerProfiles.createdAt)];

    const results = await db
      .select({
        id: providerProfiles.id,
        userId: providerProfiles.userId,
        profession: providerProfiles.profession,
        title: providerProfiles.title,
        bio: providerProfiles.bio,
        ratingAvg: providerProfiles.ratingAvg,
        ratingCount: providerProfiles.ratingCount,
        bookingCount: providerProfiles.bookingCount,
        locationCity: providerProfiles.locationCity,
        responseTime: providerProfiles.responseTime,
        identityVerified: providerProfiles.identityVerified,
        affiliationVerified: providerProfiles.affiliationVerified,
        createdAt: providerProfiles.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userDisplayName: users.displayName,
        userAvatarUrl: users.avatarUrl,
      })
      .from(providerProfiles)
      .innerJoin(users, eq(providerProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(...orderClause)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(providerProfiles)
      .where(and(...conditions));

    return paginatedResponse(results, count, page, limit);
  } catch (error) {
    console.error('List providers error:', error);
    return apiError('Failed to list providers', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const parsed = createProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const db = getDb();

    const [existing] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, user.id))
      .limit(1);
    if (existing) {
      return apiError('Provider profile already exists', 409);
    }

    const data = parsed.data;
    const [profile] = await db
      .insert(providerProfiles)
      .values({
        userId: user.id,
        profession: data.profession,
        title: data.title || null,
        bio: data.bio || null,
        bioAr: data.bioAr || null,
        experience: data.experience || null,
        yearsExperience: data.yearsExperience ?? null,
        gender: data.gender || null,
        locationCity: data.locationCity || null,
        locationGovernorate: data.locationGovernorate || null,
        locationApproximate: data.locationApproximate || null,
        locationLat: data.locationLat ? String(data.locationLat) : null,
        locationLng: data.locationLng ? String(data.locationLng) : null,
        verificationStatus: 'none',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      })
      .returning();

    await db
      .update(users)
      .set({ role: 'provider' })
      .where(eq(users.id, user.id));

    return apiSuccess(profile, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Insufficient permissions', 403);
    console.error('Create provider profile error:', error);
    return apiError('Failed to create provider profile', 500);
  }
}
