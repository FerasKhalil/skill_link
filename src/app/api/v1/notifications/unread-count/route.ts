import { NextRequest } from 'next/server';
import { getDb, notifications } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const db = getDb();

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, authUser.id), eq(notifications.isRead, false)));

    return apiSuccess({ unreadCount: count });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Get unread count error:', error);
    return apiError('Failed to get unread count', 500);
  }
}
