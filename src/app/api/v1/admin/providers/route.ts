import { NextRequest } from 'next/server';
import { getDb, providerProfiles, users, auditEvents } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  parseJsonBody,
  getPaginationParams,
  paginatedResponse,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const verificationStatus = searchParams.get('verificationStatus');

    const conditions = [];

    if (verificationStatus) {
      conditions.push(eq(providerProfiles.verificationStatus, verificationStatus as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: providerProfiles.id,
        userId: providerProfiles.userId,
        profession: providerProfiles.profession,
        title: providerProfiles.title,
        bio: providerProfiles.bio,
        verificationStatus: providerProfiles.verificationStatus,
        verifiedAt: providerProfiles.verifiedAt,
        verificationNotes: providerProfiles.verificationNotes,
        identityVerified: providerProfiles.identityVerified,
        affiliationVerified: providerProfiles.affiliationVerified,
        ratingAvg: providerProfiles.ratingAvg,
        ratingCount: providerProfiles.ratingCount,
        bookingCount: providerProfiles.bookingCount,
        locationCity: providerProfiles.locationCity,
        createdAt: providerProfiles.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userDisplayName: users.displayName,
        userEmail: users.email,
      })
      .from(providerProfiles)
      .innerJoin(users, eq(providerProfiles.userId, users.id))
      .where(whereClause)
      .orderBy(desc(providerProfiles.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(providerProfiles)
      .where(whereClause);

    return paginatedResponse(results, count, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin list providers error:', error);
    return apiError('Failed to list providers', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { providerProfileId, verificationStatus, verificationNotes } = body as {
      providerProfileId?: string;
      verificationStatus?: string;
      verificationNotes?: string;
    };

    if (!providerProfileId) return apiError('providerProfileId is required');

    const validStatuses = ['approved', 'rejected', 'requires_info'];
    if (!verificationStatus || !validStatuses.includes(verificationStatus)) {
      return apiError(`verificationStatus must be one of: ${validStatuses.join(', ')}`);
    }

    const db = getDb();

    const [profile] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, providerProfileId))
      .limit(1);
    if (!profile) return apiNotFound('Provider profile not found');

    const updateData: Record<string, unknown> = {
      verificationStatus,
      verificationNotes: verificationNotes || null,
      updatedAt: new Date(),
    };

    if (verificationStatus === 'approved') {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = admin.id;

      await db
        .update(users)
        .set({ role: 'provider' })
        .where(eq(users.id, profile.userId));
    }

    const [updated] = await db
      .update(providerProfiles)
      .set(updateData)
      .where(eq(providerProfiles.id, providerProfileId))
      .returning();

    await db.insert(auditEvents).values({
      actorId: admin.id,
      action: 'admin.update_provider_verification',
      targetType: 'provider_profile',
      targetId: providerProfileId,
      details: {
        from: profile.verificationStatus,
        to: verificationStatus,
        verificationNotes: verificationNotes || null,
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin update provider error:', error);
    return apiError('Failed to update provider verification', 500);
  }
}
