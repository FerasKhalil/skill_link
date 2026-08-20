import { NextRequest } from 'next/server';
import { getDb, users, providerProfiles, listings, bookings, reports, reviews, conversations, messages } from '@/db';
import { eq, sql, gte, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = getDb();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      [totalUsersRow],
      [newUsersRow],
      [totalProvidersRow],
      [pendingVerificationsRow],
      [approvedProvidersRow],
      [totalListingsRow],
      [activeListingsRow],
      [totalBookingsRow],
      [pendingBookingsRow],
      [confirmedBookingsRow],
      [completedBookingsRow],
      [cancelledBookingsRow],
      [totalReportsRow],
      [openReportsRow],
      [underReviewReportsRow],
      [totalReviewsRow],
      [avgRatingRow],
      [totalConversationsRow],
      [totalMessagesRow],
      [suspendedUsersRow],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
      db.select({ count: sql<number>`count(*)::int` }).from(providerProfiles),
      db.select({ count: sql<number>`count(*)::int` }).from(providerProfiles).where(eq(providerProfiles.verificationStatus, 'pending')),
      db.select({ count: sql<number>`count(*)::int` }).from(providerProfiles).where(eq(providerProfiles.verificationStatus, 'approved')),
      db.select({ count: sql<number>`count(*)::int` }).from(listings),
      db.select({ count: sql<number>`count(*)::int` }).from(listings).where(eq(listings.status, 'active')),
      db.select({ count: sql<number>`count(*)::int` }).from(bookings),
      db.select({ count: sql<number>`count(*)::int` }).from(bookings).where(eq(bookings.state, 'pending')),
      db.select({ count: sql<number>`count(*)::int` }).from(bookings).where(eq(bookings.state, 'confirmed')),
      db.select({ count: sql<number>`count(*)::int` }).from(bookings).where(eq(bookings.state, 'completed')),
      db.select({ count: sql<number>`count(*)::int` }).from(bookings).where(eq(bookings.state, 'cancelled')),
      db.select({ count: sql<number>`count(*)::int` }).from(reports),
      db.select({ count: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, 'open')),
      db.select({ count: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, 'under_review')),
      db.select({ count: sql<number>`count(*)::int` }).from(reviews),
      db.select({ avg: sql<string>`coalesce(avg(${reviews.rating}), 0)::text` }).from(reviews),
      db.select({ count: sql<number>`count(*)::int` }).from(conversations),
      db.select({ count: sql<number>`count(*)::int` }).from(messages),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.accountState, 'suspended')),
    ]);

    const roleBreakdown = await db
      .select({ role: users.role, count: sql<number>`count(*)::int` })
      .from(users)
      .groupBy(users.role);

    const recentUsers = await db
      .select({ id: users.id, displayName: users.displayName, email: users.email, role: users.role, createdAt: users.createdAt })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    const recentBookings = await db
      .select({ id: bookings.id, state: bookings.state, createdAt: bookings.createdAt })
      .from(bookings)
      .orderBy(desc(bookings.createdAt))
      .limit(5);

    const recentReviews = await db
      .select({ id: reviews.id, rating: reviews.rating, title: reviews.title, createdAt: reviews.createdAt })
      .from(reviews)
      .orderBy(desc(reviews.createdAt))
      .limit(5);

    return apiSuccess({
      users: {
        total: totalUsersRow?.count ?? 0,
        newLast7Days: newUsersRow?.count ?? 0,
        suspended: suspendedUsersRow?.count ?? 0,
        byRole: roleBreakdown.reduce((acc, r) => { acc[r.role] = r.count; return acc; }, {} as Record<string, number>),
      },
      providers: {
        total: totalProvidersRow?.count ?? 0,
        approved: approvedProvidersRow?.count ?? 0,
        pendingVerifications: pendingVerificationsRow?.count ?? 0,
      },
      listings: { total: totalListingsRow?.count ?? 0, active: activeListingsRow?.count ?? 0 },
      bookings: {
        total: totalBookingsRow?.count ?? 0,
        pending: pendingBookingsRow?.count ?? 0,
        confirmed: confirmedBookingsRow?.count ?? 0,
        completed: completedBookingsRow?.count ?? 0,
        cancelled: cancelledBookingsRow?.count ?? 0,
      },
      reports: { total: totalReportsRow?.count ?? 0, open: openReportsRow?.count ?? 0, underReview: underReviewReportsRow?.count ?? 0 },
      reviews: { total: totalReviewsRow?.count ?? 0, avgRating: parseFloat(avgRatingRow?.avg ?? '0') },
      conversations: { total: totalConversationsRow?.count ?? 0 },
      messages: { total: totalMessagesRow?.count ?? 0 },
      recentUsers,
      recentBookings,
      recentReviews,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin overview error:', error);
    return apiError('Failed to fetch admin overview', 500);
  }
}
