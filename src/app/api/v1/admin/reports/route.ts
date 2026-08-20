import { NextRequest } from 'next/server';
import { getDb, reports, users, auditEvents } from '@/db';
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
    const type = searchParams.get('type');

    const conditions = [];

    if (status) {
      conditions.push(eq(reports.status, status as any));
    }
    if (type) {
      conditions.push(eq(reports.targetType, type));
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
        reporterEmail: users.email,
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
    console.error('Admin list reports error:', error);
    return apiError('Failed to list reports', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { reportId, status, resolution } = body as {
      reportId?: string;
      status?: string;
      resolution?: string;
    };

    if (!reportId) return apiError('reportId is required');

    const validStatuses = ['open', 'under_review', 'resolved', 'dismissed'];
    if (!status || !validStatuses.includes(status)) {
      return apiError(`status must be one of: ${validStatuses.join(', ')}`);
    }

    const db = getDb();

    const [existing] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);
    if (!existing) return apiNotFound('Report not found');

    const updateData: Record<string, unknown> = {
      status: status as any,
      updatedAt: new Date(),
    };

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolution = resolution || null;
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = admin.id;
    }

    const [updated] = await db
      .update(reports)
      .set(updateData)
      .where(eq(reports.id, reportId))
      .returning();

    await db.insert(auditEvents).values({
      actorId: admin.id,
      action: 'admin.resolve_report',
      targetType: 'report',
      targetId: reportId,
      details: {
        from: existing.status,
        to: status,
        resolution: resolution || null,
        targetType: existing.targetType,
        targetId: existing.targetId,
        reason: existing.reason,
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin resolve report error:', error);
    return apiError('Failed to resolve report', 500);
  }
}
