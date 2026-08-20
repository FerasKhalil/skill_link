import { NextRequest } from 'next/server';
import { getDb, users, auditEvents } from '@/db';
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
    const q = searchParams.get('q');
    const role = searchParams.get('role');
    const state = searchParams.get('state');

    const conditions = [];

    if (q) {
      conditions.push(
        sql`(${users.firstName} ILIKE ${'%' + q + '%'} OR ${users.lastName} ILIKE ${'%' + q + '%'} OR ${users.email} ILIKE ${'%' + q + '%'} OR ${users.displayName} ILIKE ${'%' + q + '%'})`
      );
    }
    if (role) {
      conditions.push(eq(users.role, role as any));
    }
    if (state) {
      conditions.push(eq(users.accountState, state as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        locale: users.locale,
        role: users.role,
        accountState: users.accountState,
        emailVerified: users.emailVerified,
        phoneVerified: users.phoneVerified,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);

    return paginatedResponse(results, count, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin list users error:', error);
    return apiError('Failed to list users', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { userId, role, accountState } = body as {
      userId?: string;
      role?: string;
      accountState?: string;
    };

    if (!userId) return apiError('userId is required');

    const validRoles = ['customer', 'provider', 'admin', 'moderator'];
    const validStates = ['active', 'suspended', 'deactivated'];

    if (role && !validRoles.includes(role)) {
      return apiError(`role must be one of: ${validRoles.join(', ')}`);
    }
    if (accountState && !validStates.includes(accountState)) {
      return apiError(`accountState must be one of: ${validStates.join(', ')}`);
    }

    const db = getDb();

    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) return apiNotFound('User not found');

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (role) updateData.role = role;
    if (accountState) updateData.accountState = accountState;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (role && role !== target.role) changes.role = { from: target.role, to: role };
    if (accountState && accountState !== target.accountState) changes.accountState = { from: target.accountState, to: accountState };

    await db.insert(auditEvents).values({
      actorId: admin.id,
      action: 'admin.update_user',
      targetType: 'user',
      targetId: userId,
      details: { changes, email: target.email },
    });

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin update user error:', error);
    return apiError('Failed to update user', 500);
  }
}
