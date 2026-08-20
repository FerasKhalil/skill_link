import { NextRequest } from 'next/server';
import { getDb, savedProviders } from '@/db';
import { and, eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { providerId } = await params;
    const db = getDb();

    const [existing] = await db
      .select({ id: savedProviders.id })
      .from(savedProviders)
      .where(and(eq(savedProviders.userId, user.id), eq(savedProviders.providerId, providerId)))
      .limit(1);

    if (!existing) {
      return apiNotFound('Saved provider not found');
    }

    await db
      .delete(savedProviders)
      .where(and(eq(savedProviders.userId, user.id), eq(savedProviders.providerId, providerId)));

    return apiSuccess({ message: 'Provider unsaved' });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return apiError('Authentication required', 401);
    }
    console.error('Unsave provider error:', error);
    return apiError('Failed to unsave provider', 500);
  }
}
