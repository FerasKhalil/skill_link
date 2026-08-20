import { NextRequest } from 'next/server';
import { getDb, bookings, users, providerProfiles } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
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
    const state = searchParams.get('state');

    const conditions = [];

    if (state) {
      conditions.push(eq(bookings.state, state as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: bookings.id,
        customerId: bookings.customerId,
        providerId: bookings.providerId,
        listingId: bookings.listingId,
        state: bookings.state,
        title: bookings.title,
        description: bookings.description,
        deliveryMode: bookings.deliveryMode,
        scheduledDate: bookings.scheduledDate,
        scheduledTime: bookings.scheduledTime,
        durationMinutes: bookings.durationMinutes,
        price: bookings.price,
        currency: bookings.currency,
        cancellationReason: bookings.cancellationReason,
        cancelledBy: bookings.cancelledBy,
        cancelledAt: bookings.cancelledAt,
        completedAt: bookings.completedAt,
        confirmedAt: bookings.confirmedAt,
        notes: bookings.notes,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        customerFirstName: users.firstName,
        customerLastName: users.lastName,
        customerDisplayName: users.displayName,
        customerEmail: users.email,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.customerId, users.id))
      .where(whereClause)
      .orderBy(desc(bookings.createdAt))
      .limit(limit)
      .offset(offset);

    const providerIds = [...new Set(results.map((r) => r.providerId))];
    const providerProfilesList =
      providerIds.length > 0
        ? await db
            .select({
              id: providerProfiles.id,
              userId: providerProfiles.userId,
              profession: providerProfiles.profession,
            })
            .from(providerProfiles)
            .where(sql`${providerProfiles.id} IN ${providerIds}`)
        : [];

    const providerUserIds = providerProfilesList.map((p) => p.userId);
    const providerUsers =
      providerUserIds.length > 0
        ? await db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              displayName: users.displayName,
              email: users.email,
            })
            .from(users)
            .where(sql`${users.id} IN ${providerUserIds}`)
        : [];

    const providerUserMap = new Map(providerUsers.map((u) => [u.id, u]));
    const providerMap = new Map(
      providerProfilesList.map((p) => [
        p.id,
        { ...p, user: providerUserMap.get(p.userId) || null },
      ]),
    );

    const enriched = results.map((r) => ({
      ...r,
      provider: providerMap.get(r.providerId) || null,
    }));

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(whereClause);

    return paginatedResponse(enriched, count, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin list bookings error:', error);
    return apiError('Failed to list bookings', 500);
  }
}
