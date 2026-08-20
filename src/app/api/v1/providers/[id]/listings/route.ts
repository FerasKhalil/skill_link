import { NextRequest } from 'next/server';
import { getDb, providerProfiles, listings, searchIndex, users } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiUnauthorized,
  apiForbidden,
  parseJsonBody,
  getPaginationParams,
  paginatedResponse,
} from '@/lib/api-helpers';
import { z } from 'zod';

const createListingSchema = z.object({
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  slug: z.string().max(200).optional(),
  titleEn: z.string().min(1, 'English title is required').max(300),
  titleAr: z.string().min(1, 'Arabic title is required').max(300),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  deliveryModes: z.array(z.enum(['onsite', 'remote', 'both'])).default(['onsite']),
  serviceAreas: z.array(z.string()).optional(),
  pricingModel: z.enum(['hourly', 'fixed', 'starting_at']).default('hourly'),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  currency: z.string().max(5).default('JOD'),
  durationMin: z.number().int().min(1).optional(),
  durationMax: z.number().int().min(1).optional(),
  credentials: z.string().optional(),
  credentialsAr: z.string().optional(),
  maxBookingsPerDay: z.number().int().min(1).optional(),
  bookingPolicy: z.enum(['auto', 'manual']).default('manual'),
  bookingHorizonDays: z.number().int().min(1).optional(),
  slotDurationMinutes: z.number().int().min(15).optional(),
  status: z.enum(['draft', 'active']).default('draft'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);

    const conditions = [
      eq(listings.providerId, id),
      sql`${listings.status} IN ('active', 'paused')`,
    ];

    const results = await db
      .select({
        id: listings.id,
        categoryId: listings.categoryId,
        subcategoryId: listings.subcategoryId,
        slug: listings.slug,
        titleEn: listings.titleEn,
        titleAr: listings.titleAr,
        descriptionEn: listings.descriptionEn,
        descriptionAr: listings.descriptionAr,
        status: listings.status,
        deliveryModes: listings.deliveryModes,
        pricingModel: listings.pricingModel,
        priceMin: listings.priceMin,
        priceMax: listings.priceMax,
        currency: listings.currency,
        durationMin: listings.durationMin,
        durationMax: listings.durationMax,
        viewCount: listings.viewCount,
        publishedAt: listings.publishedAt,
        createdAt: listings.createdAt,
      })
      .from(listings)
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(and(...conditions));

    return paginatedResponse(results, count, page, limit);
  } catch (error) {
    console.error('List provider listings error:', error);
    return apiError('Failed to list provider listings', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await params;
    const db = getDb();

    const [provider] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, id))
      .limit(1);

    if (!provider) return apiNotFound('Provider not found');
    if (provider.userId !== authUser.id && authUser.role !== 'admin') {
      return apiForbidden('You can only create listings for your own profile');
    }

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const data = parsed.data;
    const now = new Date();

    const [listing] = await db
      .insert(listings)
      .values({
        providerId: id,
        categoryId: data.categoryId || null,
        subcategoryId: data.subcategoryId || null,
        slug: data.slug || null,
        titleEn: data.titleEn,
        titleAr: data.titleAr,
        descriptionEn: data.descriptionEn || null,
        descriptionAr: data.descriptionAr || null,
        status: data.status,
        deliveryModes: data.deliveryModes,
        serviceAreas: data.serviceAreas || ['Amman'],
        pricingModel: data.pricingModel,
        priceMin: data.priceMin !== undefined ? String(data.priceMin) : null,
        priceMax: data.priceMax !== undefined ? String(data.priceMax) : null,
        currency: data.currency,
        durationMin: data.durationMin ?? null,
        durationMax: data.durationMax ?? null,
        credentials: data.credentials || null,
        credentialsAr: data.credentialsAr || null,
        maxBookingsPerDay: data.maxBookingsPerDay ?? 10,
        bookingPolicy: data.bookingPolicy,
        bookingHorizonDays: data.bookingHorizonDays ?? 30,
        slotDurationMinutes: data.slotDurationMinutes ?? 60,
        publishedAt: data.status === 'active' ? now : null,
      })
      .returning();

    const [userRow] = await db.select().from(users).where(eq(users.id, provider.userId)).limit(1);
    const providerName = userRow?.displayName || '';

    await db.insert(searchIndex).values({
      listingId: listing.id,
      providerId: id,
      textEn: [data.titleEn, data.descriptionEn, providerName].filter(Boolean).join(' '),
      textAr: [data.titleAr, data.descriptionAr, providerName].filter(Boolean).join(' '),
      categoryId: data.categoryId || null,
      subcategoryId: data.subcategoryId || null,
      priceMin: data.priceMin !== undefined ? String(data.priceMin) : null,
      priceMax: data.priceMax !== undefined ? String(data.priceMax) : null,
      deliveryModes: data.deliveryModes,
      serviceAreas: data.serviceAreas || ['Amman'],
      isVerified: provider.verificationStatus === 'approved',
      isActive: data.status === 'active',
      locationLat: provider.locationLat,
      locationLng: provider.locationLng,
    });

    return apiSuccess(listing, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiForbidden();
    console.error('Create listing error:', error);
    return apiError('Failed to create listing', 500);
  }
}
