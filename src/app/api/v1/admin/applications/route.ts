import { NextRequest } from 'next/server';
import { getDb, providerApplications, providerProfiles, users, auditEvents } from '@/db';
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
    const status = searchParams.get('status');

    const conditions = [];

    if (status) {
      conditions.push(eq(providerApplications.status, status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: providerApplications.id,
        userId: providerApplications.userId,
        providerProfileId: providerApplications.providerProfileId,
        status: providerApplications.status,
        profession: providerApplications.profession,
        title: providerApplications.title,
        bio: providerApplications.bio,
        adminNotes: providerApplications.adminNotes,
        reviewedBy: providerApplications.reviewedBy,
        reviewedAt: providerApplications.reviewedAt,
        submittedAt: providerApplications.submittedAt,
        createdAt: providerApplications.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userDisplayName: users.displayName,
        userEmail: users.email,
      })
      .from(providerApplications)
      .innerJoin(users, eq(providerApplications.userId, users.id))
      .where(whereClause)
      .orderBy(desc(providerApplications.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(providerApplications)
      .where(whereClause);

    return paginatedResponse(results, count, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin list applications error:', error);
    return apiError('Failed to list applications', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { applicationId, status, adminNotes } = body as {
      applicationId?: string;
      status?: string;
      adminNotes?: string;
    };

    if (!applicationId) return apiError('applicationId is required');

    const validStatuses = ['approved', 'rejected', 'requires_info'];
    if (!status || !validStatuses.includes(status)) {
      return apiError(`status must be one of: ${validStatuses.join(', ')}`);
    }

    const db = getDb();

    const [application] = await db
      .select()
      .from(providerApplications)
      .where(eq(providerApplications.id, applicationId))
      .limit(1);
    if (!application) return apiNotFound('Application not found');

    const [updated] = await db
      .update(providerApplications)
      .set({
        status: status as any,
        adminNotes: adminNotes || null,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(providerApplications.id, applicationId))
      .returning();

    if (application.providerProfileId) {
      const profileUpdate: Record<string, unknown> = {
        verificationStatus: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'requires_info',
        updatedAt: new Date(),
      };
      if (status === 'approved') {
        profileUpdate.verifiedAt = new Date();
        profileUpdate.verifiedBy = admin.id;
        profileUpdate.identityVerified = true;
      }
      await db
        .update(providerProfiles)
        .set(profileUpdate)
        .where(eq(providerProfiles.id, application.providerProfileId));
    }

    if (status === 'approved' && application.userId) {
      await db
        .update(users)
        .set({ role: 'provider', updatedAt: new Date() })
        .where(eq(users.id, application.userId));
    }

    await db.insert(auditEvents).values({
      actorId: admin.id,
      action: 'admin.review_application',
      targetType: 'provider_application',
      targetId: applicationId,
      details: {
        from: application.status,
        to: status,
        adminNotes: adminNotes || null,
        applicantEmail: application.userId,
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin review application error:', error);
    return apiError('Failed to review application', 500);
  }
}
