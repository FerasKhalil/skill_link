import { NextRequest } from 'next/server';
import {
  getDb,
  quoteRequests,
  providerProfiles,
  users,
  notifications,
} from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
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
    const status = searchParams.get('status');

    const conditions = [
      sql`(${quoteRequests.customerId} = ${user.id} OR EXISTS (
        SELECT 1 FROM provider_profiles pp WHERE pp.id = ${quoteRequests.providerId} AND pp.user_id = ${user.id}
      ))`,
    ];

    if (status) {
      conditions.push(eq(quoteRequests.status, status));
    }

    const results = await db
      .select({
        id: quoteRequests.id,
        title: quoteRequests.title,
        description: quoteRequests.description,
        deliveryMode: quoteRequests.deliveryMode,
        preferredDate: quoteRequests.preferredDate,
        preferredTime: quoteRequests.preferredTime,
        budget: quoteRequests.budget,
        currency: quoteRequests.currency,
        status: quoteRequests.status,
        providerResponse: quoteRequests.providerResponse,
        providerPrice: quoteRequests.providerPrice,
        respondedAt: quoteRequests.respondedAt,
        createdAt: quoteRequests.createdAt,
        customerId: quoteRequests.customerId,
        providerId: quoteRequests.providerId,
        listingId: quoteRequests.listingId,
        customerFirstName: users.firstName,
        customerLastName: users.lastName,
        customerDisplayName: users.displayName,
        customerAvatarUrl: users.avatarUrl,
      })
      .from(quoteRequests)
      .innerJoin(users, eq(quoteRequests.customerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(quoteRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(quoteRequests)
      .where(and(...conditions));

    return paginatedResponse(results, count, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('List quotes error:', error);
    return apiError('Failed to list quotes', 500);
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
      title,
      description,
      deliveryMode,
      preferredDate,
      preferredTime,
      budget,
    } = body as {
      providerId?: string;
      listingId?: string;
      title?: string;
      description?: string;
      deliveryMode?: string;
      preferredDate?: string;
      preferredTime?: string;
      budget?: number;
    };

    if (!providerId) return apiError('providerId is required');
    if (!title) return apiError('title is required');
    if (!description) return apiError('description is required');

    const db = getDb();

    const [providerProfile] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, providerId))
      .limit(1);
    if (!providerProfile) return apiNotFound('Provider not found');

    if (providerProfile.userId === user.id) return apiError('Cannot send quote to yourself');

    const [quote] = await db
      .insert(quoteRequests)
      .values({
        customerId: user.id,
        providerId,
        listingId: listingId || null,
        title,
        description,
        deliveryMode: (deliveryMode as any) || null,
        preferredDate: preferredDate || null,
        preferredTime: preferredTime || null,
        budget: budget ? String(budget) : null,
        status: 'pending',
      })
      .returning();

    await db.insert(notifications).values({
      userId: providerProfile.userId,
      type: 'quote',
      title: 'New quote request',
      body: `You have a new quote request: ${title}`,
      link: `/quotes/${quote.id}`,
      metadata: { quoteId: quote.id },
    });

    return apiSuccess(quote, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Create quote error:', error);
    return apiError('Failed to create quote', 500);
  }
}
