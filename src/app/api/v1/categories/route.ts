import { NextRequest } from 'next/server';
import { getDb, categories } from '@/db';
import { eq, and, sql, desc } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const parentId = searchParams.get('parent_id');
    const slug = searchParams.get('slug');

    if (slug) {
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
        })
        .from(categories)
        .where(and(eq(categories.slug, slug), eq(categories.status, 'active')))
        .limit(1);

      if (!category) {
        return apiError('Category not found', 404);
      }

      return apiSuccess(category);
    }

    const conditions = [eq(categories.status, 'active')];

    if (parentId !== null) {
      if (parentId === 'null' || parentId === '') {
        conditions.push(sql`${categories.parentId} IS NULL`);
      } else {
        conditions.push(eq(categories.parentId, parentId));
      }
    } else {
      conditions.push(sql`${categories.parentId} IS NULL`);
    }

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
        createdAt: categories.createdAt,
        childCount: sql<number>`(
          SELECT count(*)::int FROM categories c
          WHERE c.parent_id = ${categories.id} AND c.status = 'active'
        )`,
        listingCount: sql<number>`(
          SELECT count(*)::int FROM listings l
          WHERE l.category_id = ${categories.id} AND l.status = 'active'
        )`,
      })
      .from(categories)
      .where(and(...conditions))
      .orderBy(desc(categories.sortOrder), desc(categories.createdAt));

    return apiSuccess(results);
  } catch (error) {
    console.error('Categories list error:', error);
    return apiError('Failed to fetch categories', 500);
  }
}
