import { NextRequest } from 'next/server';
import {
  getDb,
  bookings,
  providerProfiles,
  users,
  listings,
  availabilityRules,
  availabilityExceptions,
} from '@/db';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  parseJsonBody,
  getPaginationParams,
  paginatedResponse,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    const providerProfile = await db
      .select({ id: providerProfiles.id })
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, user.id))
      .limit(1);

    const providerProfileId = providerProfile[0]?.id;

    const conditions = [
      or(
        eq(bookings.customerId, user.id),
        providerProfileId ? eq(bookings.providerId, providerProfileId) : sql`false`,
      ),
    ];

    if (state) {
      conditions.push(eq(bookings.state, state as any));
    }

    const whereClause = and(...conditions);

    const results = await db
      .select({
        id: bookings.id,
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
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        customerId: bookings.customerId,
        providerId: bookings.providerId,
        listingId: bookings.listingId,
        customerFirstName: users.firstName,
        customerLastName: users.lastName,
        customerDisplayName: users.displayName,
        customerAvatarUrl: users.avatarUrl,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.customerId, users.id))
      .where(whereClause)
      .orderBy(desc(bookings.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(whereClause);

    return paginatedResponse(results, count, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('List bookings error:', error);
    return apiError('Failed to list bookings', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const {
      providerId,
      listingId,
      scheduledDate,
      scheduledTime,
      durationMinutes,
      deliveryMode,
      description,
    } = body as {
      providerId?: string;
      listingId?: string;
      scheduledDate?: string;
      scheduledTime?: string;
      durationMinutes?: number;
      deliveryMode?: string;
      description?: string;
    };

    if (!providerId) return apiError('providerId is required');
    if (!scheduledDate) return apiError('scheduledDate is required');
    if (!scheduledTime) return apiError('scheduledTime is required');

    const db = getDb();

    const [providerProfile] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, providerId))
      .limit(1);
    if (!providerProfile) return apiNotFound('Provider not found');

    if (providerProfile.userId === user.id) return apiError('Cannot book yourself');

    if (listingId) {
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);
      if (!listing) return apiNotFound('Listing not found');
    }

    const scheduledDateObj = new Date(scheduledDate);
    const dayOfWeek = scheduledDateObj.getDay();

    const [availabilityRule] = await db
      .select()
      .from(availabilityRules)
      .where(
        and(
          eq(availabilityRules.providerId, providerId),
          eq(availabilityRules.dayOfWeek, dayOfWeek),
          eq(availabilityRules.isActive, true),
        ),
      )
      .limit(1);

    const [exception] = await db
      .select()
      .from(availabilityExceptions)
      .where(
        and(
          eq(availabilityExceptions.providerId, providerId),
          eq(availabilityExceptions.date, scheduledDate),
        ),
      )
      .limit(1);

    if (exception && !exception.isAvailable) {
      return apiError('Provider is not available on this date');
    }

    if (!exception && !availabilityRule) {
      return apiError('Provider is not available on this date');
    }

    if (availabilityRule) {
      if (scheduledTime < availabilityRule.startTime || scheduledTime >= availabilityRule.endTime) {
        return apiError('Selected time is outside provider availability hours');
      }
    }

    const existingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.providerId, providerId),
          eq(bookings.scheduledDate, scheduledDate),
          eq(bookings.scheduledTime, scheduledTime),
          sql`${bookings.state} NOT IN ('cancelled', 'no_show')`,
        ),
      );

    if (existingBookings.length >= (availabilityRule?.capacity || 1)) {
      return apiError('Time slot is no longer available');
    }

    const [booking] = await db
      .insert(bookings)
      .values({
        customerId: user.id,
        providerId,
        listingId: listingId || null,
        state: 'pending',
        scheduledDate,
        scheduledTime,
        durationMinutes: durationMinutes || null,
        deliveryMode: (deliveryMode as any) || null,
        description: description || null,
      })
      .returning();

    return apiSuccess(booking, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Create booking error:', error);
    return apiError('Failed to create booking', 500);
  }
}
