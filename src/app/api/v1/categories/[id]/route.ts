import { NextRequest } from 'next/server';
import { getDb, categories } from '@/db';
import { eq, and, sql } from 'drizzle-orm';
import { apiSuccess, apiNotFound, apiError } from '@/lib/api-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [category] = await db
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
        createdAt: categories.createdAt,
        listingCount: sql<number>`(
          SELECT count(*)::int FROM listings l
          WHERE l.category_id = ${categories.id} AND l.status = 'active'
        )`,
      })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      return apiNotFound('Category not found');
    }

    const children = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        nameEn: categories.nameEn,
        nameAr: categories.nameAr,
        icon: categories.icon,
        imageUrl: categories.imageUrl,
        sortOrder: categories.sortOrder,
        listingCount: sql<number>`(
          SELECT count(*)::int FROM listings l
          WHERE l.category_id = ${categories.id} AND l.status = 'active'
        )`,
      })
      .from(categories)
      .where(and(eq(categories.parentId, id), eq(categories.status, 'active')))
      .orderBy(categories.sortOrder);

    return apiSuccess({ ...category, children });
  } catch (error) {
    console.error('Category detail error:', error);
    return apiError('Failed to fetch category', 500);
  }
}
