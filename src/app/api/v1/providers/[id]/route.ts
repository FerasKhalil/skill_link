import { NextRequest } from 'next/server';
import { getDb, providerProfiles, users, listings } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiUnauthorized,
  apiForbidden,
  parseJsonBody,
} from '@/lib/api-helpers';
import { z } from 'zod';

const updateProfileSchema = z.object({
  profession: z.string().min(1).max(200).optional(),
  title: z.string().max(200).optional(),
  bio: z.string().optional(),
  bioAr: z.string().optional(),
  experience: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  gender: z.string().max(20).optional(),
  responseTime: z.string().max(50).optional(),
  locationCity: z.string().max(100).optional(),
  locationGovernorate: z.string().max(100).optional(),
  locationApproximate: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [profile] = await db
      .select({
        id: providerProfiles.id,
        userId: providerProfiles.userId,
        profession: providerProfiles.profession,
        title: providerProfiles.title,
        bio: providerProfiles.bio,
        bioAr: providerProfiles.bioAr,
        experience: providerProfiles.experience,
        yearsExperience: providerProfiles.yearsExperience,
        gender: providerProfiles.gender,
        verificationStatus: providerProfiles.verificationStatus,
        identityVerified: providerProfiles.identityVerified,
        affiliationVerified: providerProfiles.affiliationVerified,
        affiliationOrg: providerProfiles.affiliationOrg,
        ratingAvg: providerProfiles.ratingAvg,
        ratingCount: providerProfiles.ratingCount,
        bookingCount: providerProfiles.bookingCount,
        responseTime: providerProfiles.responseTime,
        locationCity: providerProfiles.locationCity,
        locationGovernorate: providerProfiles.locationGovernorate,
        locationApproximate: providerProfiles.locationApproximate,
        createdAt: providerProfiles.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userDisplayName: users.displayName,
        userAvatarUrl: users.avatarUrl,
      })
      .from(providerProfiles)
      .innerJoin(users, eq(providerProfiles.userId, users.id))
      .where(eq(providerProfiles.id, id))
      .limit(1);

    if (!profile) return apiNotFound('Provider not found');

    const [{ listingCount }] = await db
      .select({ listingCount: sql<number>`count(*)::int` })
      .from(listings)
      .where(
        sql`${listings.providerId} = ${id} AND ${listings.status} IN ('active', 'paused')`
      );

    return apiSuccess({ ...profile, listingCount });
  } catch (error) {
    console.error('Get provider error:', error);
    return apiError('Failed to get provider', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiUnauthorized();

    const { id } = await params;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, id))
      .limit(1);

    if (!existing) return apiNotFound('Provider not found');
    if (existing.userId !== user.id && user.role !== 'admin') {
      return apiForbidden('You can only update your own profile');
    }

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.profession !== undefined) updateData.profession = data.profession;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.bioAr !== undefined) updateData.bioAr = data.bioAr;
    if (data.experience !== undefined) updateData.experience = data.experience;
    if (data.yearsExperience !== undefined) updateData.yearsExperience = data.yearsExperience;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.responseTime !== undefined) updateData.responseTime = data.responseTime;
    if (data.locationCity !== undefined) updateData.locationCity = data.locationCity;
    if (data.locationGovernorate !== undefined) updateData.locationGovernorate = data.locationGovernorate;
    if (data.locationApproximate !== undefined) updateData.locationApproximate = data.locationApproximate;
    if (data.locationLat !== undefined) updateData.locationLat = String(data.locationLat);
    if (data.locationLng !== undefined) updateData.locationLng = String(data.locationLng);

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(providerProfiles)
      .set(updateData)
      .where(eq(providerProfiles.id, id))
      .returning();

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Update provider error:', error);
    return apiError('Failed to update provider profile', 500);
  }
}
