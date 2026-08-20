import { NextRequest } from 'next/server';
import { getDb, categories } from '@/db';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { apiSuccess, apiError, parseJsonBody } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request);

    if (!body) {
      return apiError('Invalid request body');
    }

    const { nameEn, nameAr, description } = body;

    if (!nameEn || typeof nameEn !== 'string' || nameEn.trim().length === 0) {
      return apiError('nameEn is required');
    }

    if (!nameAr || typeof nameAr !== 'string' || nameAr.trim().length === 0) {
      return apiError('nameAr is required');
    }

    const db = getDb();

    const slug = nameEn
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing) {
      return apiError('A category with a similar name already exists', 409);
    }

    const [suggested] = await db
      .insert(categories)
      .values({
        slug,
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        descriptionEn: description || null,
        status: 'suggested',
        suggestedBy: user.id,
      })
      .returning({ id: categories.id, slug: categories.slug });

    return apiSuccess({ id: suggested.id, slug: suggested.slug }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return apiError('Authentication required', 401);
    }
    console.error('Category suggest error:', error);
    return apiError('Failed to submit category suggestion', 500);
  }
}
