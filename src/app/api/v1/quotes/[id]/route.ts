import { NextRequest } from 'next/server';
import {
  getDb,
  quoteRequests,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const db = getDb();

    const [quote] = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.id, id))
      .limit(1);
    if (!quote) return apiNotFound('Quote not found');

    const [providerProfile] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, quote.providerId))
      .limit(1);
    if (!providerProfile || providerProfile.userId !== user.id) {
      return apiError('Only the quoted provider can respond', 403);
    }

    if (quote.status !== 'pending' && quote.status !== 'countered') {
      return apiError(`Cannot respond to a quote with status '${quote.status}'`);
    }

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { status, providerResponse, providerPrice } = body as {
      status?: string;
      providerResponse?: string;
      providerPrice?: number;
    };

    if (!status) return apiError('status is required');
    if (!['accepted', 'declined', 'countered'].includes(status)) {
      return apiError('status must be accepted, declined, or countered');
    }

    if (status === 'countered' && !providerPrice) {
      return apiError('providerPrice is required for counter offers');
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
      respondedAt: new Date(),
    };

    if (providerResponse) updateData.providerResponse = providerResponse;
    if (providerPrice) updateData.providerPrice = String(providerPrice);

    const [updated] = await db
      .update(quoteRequests)
      .set(updateData)
      .where(eq(quoteRequests.id, id))
      .returning();

    const [customerUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, quote.customerId))
      .limit(1);

    if (customerUser) {
      await db.insert(notifications).values({
        userId: customerUser.id,
        type: 'quote',
        title: `Quote ${status}`,
        body: status === 'countered'
          ? `Provider countered with ${providerPrice} ${quote.currency}`
          : `Your quote has been ${status}`,
        link: `/quotes/${id}`,
        metadata: { quoteId: id, status },
      });
    }

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Update quote error:', error);
    return apiError('Failed to update quote', 500);
  }
}
