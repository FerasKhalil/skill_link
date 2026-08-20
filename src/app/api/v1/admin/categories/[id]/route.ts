import { NextRequest } from 'next/server';
import { getDb, categories } from '@/db';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  parseJsonBody,
} from '@/lib/api-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { nameEn, nameAr, status, descriptionEn, descriptionAr } = body as {
      nameEn?: string;
      nameAr?: string;
      status?: string;
      descriptionEn?: string;
      descriptionAr?: string;
    };

    const validStatuses = ['active', 'inactive', 'suggested', 'merged'];
    if (status && !validStatuses.includes(status)) {
      return apiError(`status must be one of: ${validStatuses.join(', ')}`);
    }

    const db = getDb();

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!existing) return apiNotFound('Category not found');

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (status !== undefined) updateData.status = status;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr;

    const [updated] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin update category error:', error);
    return apiError('Failed to update category', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!existing) return apiNotFound('Category not found');

    const [updated] = await db
      .update(categories)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin delete category error:', error);
    return apiError('Failed to delete category', 500);
  }
}
