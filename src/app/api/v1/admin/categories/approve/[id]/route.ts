import { NextRequest } from 'next/server';
import { getDb, categories, auditEvents } from '@/db';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from '@/lib/api-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!existing) return apiNotFound('Category not found');

    if (existing.status !== 'suggested') {
      return apiError('Only suggested categories can be approved');
    }

    const [updated] = await db
      .update(categories)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    await db.insert(auditEvents).values({
      actorId: admin.id,
      action: 'admin.approve_category',
      targetType: 'category',
      targetId: id,
      details: { nameEn: existing.nameEn, nameAr: existing.nameAr, slug: existing.slug },
    });

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin approve category error:', error);
    return apiError('Failed to approve category', 500);
  }
}
