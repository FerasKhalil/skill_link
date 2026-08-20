import { NextRequest } from 'next/server';
import { getDb, reports, auditEvents } from '@/db';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  parseJsonBody,
} from '@/lib/api-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await requireAdmin(request);
    const { id } = await params;
    const db = getDb();

    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);

    if (!report) return apiNotFound('Report not found');

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { status, resolution, priority } = body as {
      status?: string;
      resolution?: string;
      priority?: string;
    };

    if (status && !['under_review', 'resolved', 'dismissed'].includes(status)) {
      return apiError('status must be one of: under_review, resolved, dismissed');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'resolved' || status === 'dismissed') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = authUser.id;
      }
    }
    if (resolution !== undefined) updateData.resolution = resolution;
    if (priority) updateData.priority = priority;

    const [updated] = await db
      .update(reports)
      .set(updateData)
      .where(eq(reports.id, id))
      .returning();

    await db.insert(auditEvents).values({
      actorId: authUser.id,
      action: 'report.status_updated',
      targetType: 'report',
      targetId: id,
      details: {
        previousStatus: report.status,
        newStatus: status || report.status,
        resolution,
        priority: priority || report.priority,
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Update report error:', error);
    return apiError('Failed to update report', 500);
  }
}
