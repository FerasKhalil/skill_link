import { NextRequest } from 'next/server';
import {
  getDb,
  reports,
  notifications,
  providerProfiles,
  listings,
  reviews,
  bookings,
  messages,
  users,
} from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth, requireAdmin } from '@/lib/auth';
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

const VALID_TARGET_TYPES = ['profile', 'listing', 'message', 'review', 'booking'];
const VALID_REASONS = ['spam', 'inappropriate', 'fraud', 'harassment', 'fake_profile', 'safety', 'other'];

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const targetType = searchParams.get('targetType');

    const conditions = [];

    if (status) {
      conditions.push(eq(reports.status, status as any));
    }
    if (targetType) {
      conditions.push(eq(reports.targetType, targetType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: reports.id,
        reporterId: reports.reporterId,
        targetType: reports.targetType,
        targetId: reports.targetId,
        reason: reports.reason,
        description: reports.description,
        evidenceUrls: reports.evidenceUrls,
        status: reports.status,
        priority: reports.priority,
        assignedTo: reports.assignedTo,
        resolution: reports.resolution,
        resolvedAt: reports.resolvedAt,
        resolvedBy: reports.resolvedBy,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
        reporterFirstName: users.firstName,
        reporterLastName: users.lastName,
        reporterDisplayName: users.displayName,
      })
      .from(reports)
      .innerJoin(users, eq(reports.reporterId, users.id))
      .where(whereClause)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reports)
      .where(whereClause);

    return paginatedResponse(results, count, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('List reports error:', error);
    return apiError('Failed to list reports', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { targetType, targetId, reason, description, evidenceUrls } = body as {
      targetType?: string;
      targetId?: string;
      reason?: string;
      description?: string;
      evidenceUrls?: string[];
    };

    if (!targetType) return apiError('targetType is required');
    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return apiError(`targetType must be one of: ${VALID_TARGET_TYPES.join(', ')}`);
    }
    if (!targetId) return apiError('targetId is required');
    if (!reason) return apiError('reason is required');
    if (!VALID_REASONS.includes(reason)) {
      return apiError(`reason must be one of: ${VALID_REASONS.join(', ')}`);
    }

    const db = getDb();

    let targetExists = false;
    switch (targetType) {
      case 'profile': {
        const [target] = await db.select().from(providerProfiles).where(eq(providerProfiles.id, targetId)).limit(1);
        targetExists = !!target;
        break;
      }
      case 'listing': {
        const [target] = await db.select().from(listings).where(eq(listings.id, targetId)).limit(1);
        targetExists = !!target;
        break;
      }
      case 'message': {
        const [target] = await db.select().from(messages).where(eq(messages.id, targetId)).limit(1);
        targetExists = !!target;
        break;
      }
      case 'review': {
        const [target] = await db.select().from(reviews).where(eq(reviews.id, targetId)).limit(1);
        targetExists = !!target;
        break;
      }
      case 'booking': {
        const [target] = await db.select().from(bookings).where(eq(bookings.id, targetId)).limit(1);
        targetExists = !!target;
        break;
      }
    }

    if (!targetExists) return apiNotFound('Reported target not found');

    const [report] = await db
      .insert(reports)
      .values({
        reporterId: authUser.id,
        targetType,
        targetId,
        reason: reason as any,
        description: description || null,
        evidenceUrls: evidenceUrls || [],
      })
      .returning();

    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`${users.role} IN ('admin', 'moderator')`);

    if (admins.length > 0) {
      await db.insert(notifications).values(
        admins.map((admin) => ({
          userId: admin.id,
          type: 'report' as const,
          title: `New ${targetType} report`,
          body: `A ${targetType} has been reported for: ${reason}`,
          link: `/admin/reports/${report.id}`,
          metadata: { reportId: report.id, targetType, targetId, reason },
        })),
      );
    }

    return apiSuccess(report, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Create report error:', error);
    return apiError('Failed to create report', 500);
  }
}
