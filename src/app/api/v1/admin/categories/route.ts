import { NextRequest } from 'next/server';
import { getDb, categories, listings } from '@/db';
import { eq, desc, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = getDb();

    const results = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        nameEn: categories.nameEn,
        nameAr: categories.nameAr,
        descriptionEn: categories.descriptionEn,
        descriptionAr: categories.descriptionAr,
        icon: categories.icon,
        imageUrl: categories.imageUrl,
        parentId: categories.parentId,
        status: categories.status,
        sortOrder: categories.sortOrder,
        suggestedBy: categories.suggestedBy,
        createdAt: categories.createdAt,
        listingCount: sql<number>`count(${listings.id})::int`,
      })
      .from(categories)
      .leftJoin(listings, eq(categories.id, listings.categoryId))
      .groupBy(
        categories.id,
        categories.slug,
        categories.nameEn,
        categories.nameAr,
        categories.descriptionEn,
        categories.descriptionAr,
        categories.icon,
        categories.imageUrl,
        categories.parentId,
        categories.status,
        categories.sortOrder,
        categories.suggestedBy,
        categories.createdAt,
      )
      .orderBy(categories.sortOrder, desc(categories.createdAt));

    return apiSuccess(results);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Admin list categories error:', error);
    return apiError('Failed to list categories', 500);
  }
}
