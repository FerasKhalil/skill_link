import { NextRequest } from 'next/server';
import { getDb, auditEvents, users } from '@/db';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import {
  apiError,
  apiUnauthorized,
  apiForbidden,
  getPaginationParams,
  paginatedResponse,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const actorId = searchParams.get('actorId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const conditions = [];

    if (action) {
      conditions.push(eq(auditEvents.action, action));
    }
    if (actorId) {
      conditions.push(eq(auditEvents.actorId, actorId));
    }
    if (from) {
      conditions.push(gte(auditEvents.createdAt, new Date(from)));
    }
    if (to) {
      conditions.push(lte(auditEvents.createdAt, new Date(to)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: auditEvents.id,
        actorId: auditEvents.actorId,
        action: auditEvents.action,
        targetType: auditEvents.targetType,
        targetId: auditEvents.targetId,
        details: auditEvents.details,
        ipAddress: auditEvents.ipAddress,
        correlationId: auditEvents.correlationId,
        createdAt: auditEvents.createdAt,
        actorFirstName: users.firstName,
        actorLastName: users.lastName,
        actorDisplayName: users.displayName,
        actorEmail: users.email,
      })
      .from(auditEvents)
      .leftJoin(users, eq(auditEvents.actorId, users.id))
      .where(whereClause)
      .orderBy(desc(auditEvents.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditEvents)
      .where(whereClause);

    return paginatedResponse(results, count, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin list audit events error:', error);
    return apiError('Failed to list audit events', 500);
  }
}
