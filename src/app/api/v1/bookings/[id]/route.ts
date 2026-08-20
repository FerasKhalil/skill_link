import { NextRequest } from 'next/server';
import {
  getDb,
  bookings,
  providerProfiles,
  users,
  notifications,
} from '@/db';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  parseJsonBody,
} from '@/lib/api-helpers';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
};

async function getBookingParticipantIds(bookingId: string) {
  const db = getDb();
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) return null;

  const [providerProfile] = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.id, booking.providerId))
    .limit(1);

  return {
    booking,
    providerUserId: providerProfile?.userId || null,
    customerUserId: booking.customerId,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const result = await getBookingParticipantIds(id);

    if (!result) return apiNotFound('Booking not found');

    if (result.providerUserId !== user.id && result.customerUserId !== user.id) {
      return apiError('Access denied', 403);
    }

    const db = getDb();
    const { booking } = result;

    const [customer] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, booking.customerId))
      .limit(1);

    const [provider] = await db
      .select({
        id: providerProfiles.id,
        userId: providerProfiles.userId,
        profession: providerProfiles.profession,
        ratingAvg: providerProfiles.ratingAvg,
      })
      .from(providerProfiles)
      .where(eq(providerProfiles.id, booking.providerId))
      .limit(1);

    const [providerUser] = provider
      ? await db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, provider.userId))
          .limit(1)
      : [];

    return apiSuccess({
      ...booking,
      customer: customer || null,
      provider: provider
        ? { ...provider, user: providerUser || null }
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Get booking error:', error);
    return apiError('Failed to get booking', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const result = await getBookingParticipantIds(id);

    if (!result) return apiNotFound('Booking not found');

    const { booking, providerUserId, customerUserId } = result;

    if (providerUserId !== user.id && customerUserId !== user.id) {
      return apiError('Access denied', 403);
    }

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { state, cancellationReason } = body as {
      state?: string;
      cancellationReason?: string;
    };

    if (!state) return apiError('state is required');

    const allowed = VALID_TRANSITIONS[booking.state] || [];
    if (!allowed.includes(state)) {
      return apiError(`Cannot transition from '${booking.state}' to '${state}'`);
    }

    if (state === 'cancelled' && providerUserId !== user.id && customerUserId !== user.id) {
      return apiError('Only participants can cancel');
    }

    const db = getDb();

    const updateData: Record<string, unknown> = {
      state,
      updatedAt: new Date(),
    };

    if (state === 'cancelled') {
      updateData.cancellationReason = cancellationReason || null;
      updateData.cancelledBy = user.id;
      updateData.cancelledAt = new Date();
    } else if (state === 'confirmed') {
      updateData.confirmedAt = new Date();
    } else if (state === 'completed') {
      updateData.completedAt = new Date();
    }

    const [updated] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();

    const notificationType = state === 'cancelled' ? 'cancelled' : state;
    const notificationUserId = user.id === providerUserId ? customerUserId : providerUserId;

    if (notificationUserId) {
      await db.insert(notifications).values({
        userId: notificationUserId,
        type: 'booking',
        title: `Booking ${notificationType}`,
        body: `Your booking has been ${notificationType}`,
        link: `/bookings/${id}`,
        metadata: { bookingId: id, newState: state },
      });
    }

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Update booking error:', error);
    return apiError('Failed to update booking', 500);
  }
}
