import { NextRequest } from 'next/server';
import { getDb, notifications } from '@/db';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  parseJsonBody,
  getPaginationParams,
  paginatedResponse,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const unread = searchParams.get('unread');

    const conditions = [eq(notifications.userId, authUser.id)];

    if (unread === 'true') {
      conditions.push(eq(notifications.isRead, false));
    }

    const whereClause = and(...conditions);

    const results = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(whereClause);

    return paginatedResponse(results, count, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('List notifications error:', error);
    return apiError('Failed to list notifications', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { ids, all } = body as {
      ids?: string[];
      all?: boolean;
    };

    const db = getDb();

    if (all === true) {
      const updated = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, authUser.id), eq(notifications.isRead, false)))
        .returning();

      return apiSuccess({ markedRead: updated.length });
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      const updated = await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, authUser.id),
            inArray(notifications.id, ids),
          ),
        )
        .returning();

      return apiSuccess({ markedRead: updated.length });
    }

    return apiError('Provide ids array or set all: true');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Mark notifications read error:', error);
    return apiError('Failed to update notifications', 500);
  }
}
