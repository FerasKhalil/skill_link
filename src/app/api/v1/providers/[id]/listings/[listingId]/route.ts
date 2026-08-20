import { NextRequest } from 'next/server';
import { getDb, providerProfiles, listings, listingMedia, searchIndex } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiUnauthorized,
  apiForbidden,
  parseJsonBody,
} from '@/lib/api-helpers';
import { z } from 'zod';

const updateListingSchema = z.object({
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  slug: z.string().max(200).optional(),
  titleEn: z.string().min(1).max(300).optional(),
  titleAr: z.string().min(1).max(300).optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  deliveryModes: z.array(z.enum(['onsite', 'remote', 'both'])).optional(),
  serviceAreas: z.array(z.string()).optional(),
  pricingModel: z.enum(['hourly', 'fixed', 'starting_at']).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  currency: z.string().max(5).optional(),
  durationMin: z.number().int().min(1).optional(),
  durationMax: z.number().int().min(1).optional(),
  credentials: z.string().optional(),
  credentialsAr: z.string().optional(),
  maxBookingsPerDay: z.number().int().min(1).optional(),
  bookingPolicy: z.enum(['auto', 'manual']).optional(),
  bookingHorizonDays: z.number().int().min(1).optional(),
  slotDurationMinutes: z.number().int().min(15).optional(),
  status: z.enum(['draft', 'active', 'paused']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; listingId: string }> }
) {
  try {
    const { id, listingId } = await params;
    const db = getDb();

    const [listing] = await db
      .select()
      .from(listings)
      .where(and(eq(listings.id, listingId), eq(listings.providerId, id)))
      .limit(1);

    if (!listing) return apiNotFound('Listing not found');

    const media = await db
      .select()
      .from(listingMedia)
      .where(eq(listingMedia.listingId, listingId));

    return apiSuccess({ ...listing, media });
  } catch (error) {
    console.error('Get listing error:', error);
    return apiError('Failed to get listing', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; listingId: string }> }
) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser) return apiUnauthorized();

    const { id, listingId } = await params;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(listings)
      .where(and(eq(listings.id, listingId), eq(listings.providerId, id)))
      .limit(1);

    if (!existing) return apiNotFound('Listing not found');

    const [provider] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, id))
      .limit(1);

    if (!provider || (provider.userId !== authUser.id && authUser.role !== 'admin')) {
      return apiForbidden('You can only update your own listings');
    }

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const parsed = updateListingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.subcategoryId !== undefined) updateData.subcategoryId = data.subcategoryId;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.titleEn !== undefined) updateData.titleEn = data.titleEn;
    if (data.titleAr !== undefined) updateData.titleAr = data.titleAr;
    if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn;
    if (data.descriptionAr !== undefined) updateData.descriptionAr = data.descriptionAr;
    if (data.deliveryModes !== undefined) updateData.deliveryModes = data.deliveryModes;
    if (data.serviceAreas !== undefined) updateData.serviceAreas = data.serviceAreas;
    if (data.pricingModel !== undefined) updateData.pricingModel = data.pricingModel;
    if (data.priceMin !== undefined) updateData.priceMin = String(data.priceMin);
    if (data.priceMax !== undefined) updateData.priceMax = String(data.priceMax);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.durationMin !== undefined) updateData.durationMin = data.durationMin;
    if (data.durationMax !== undefined) updateData.durationMax = data.durationMax;
    if (data.credentials !== undefined) updateData.credentials = data.credentials;
    if (data.credentialsAr !== undefined) updateData.credentialsAr = data.credentialsAr;
    if (data.maxBookingsPerDay !== undefined) updateData.maxBookingsPerDay = data.maxBookingsPerDay;
    if (data.bookingPolicy !== undefined) updateData.bookingPolicy = data.bookingPolicy;
    if (data.bookingHorizonDays !== undefined) updateData.bookingHorizonDays = data.bookingHorizonDays;
    if (data.slotDurationMinutes !== undefined) updateData.slotDurationMinutes = data.slotDurationMinutes;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'active' && existing.status !== 'active') {
        updateData.publishedAt = new Date();
      }
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(listings)
      .set(updateData)
      .where(eq(listings.id, listingId))
      .returning();

    const newTitleEn = (data.titleEn as string) || existing.titleEn;
    const newTitleAr = (data.titleAr as string) || existing.titleAr;
    const newDescEn = (data.descriptionEn as string) ?? existing.descriptionEn;
    const newDescAr = (data.descriptionAr as string) ?? existing.descriptionAr;
    const newCategoryId = (data.categoryId as string) || existing.categoryId;
    const newSubcategoryId = (data.subcategoryId as string) || existing.subcategoryId;
    const newPriceMin = data.priceMin !== undefined ? String(data.priceMin) : existing.priceMin;
    const newPriceMax = data.priceMax !== undefined ? String(data.priceMax) : existing.priceMax;
    const newDeliveryModes = (data.deliveryModes as string[]) || existing.deliveryModes;
    const newServiceAreas = (data.serviceAreas as string[]) || existing.serviceAreas;
    const newStatus = (data.status as string) || existing.status;

    await db
      .update(searchIndex)
      .set({
        textEn: [newTitleEn, newDescEn].filter(Boolean).join(' '),
        textAr: [newTitleAr, newDescAr].filter(Boolean).join(' '),
        categoryId: newCategoryId,
        subcategoryId: newSubcategoryId,
        priceMin: newPriceMin,
        priceMax: newPriceMax,
        deliveryModes: newDeliveryModes,
        serviceAreas: newServiceAreas,
        isActive: newStatus === 'active',
      })
      .where(eq(searchIndex.listingId, listingId));

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Update listing error:', error);
    return apiError('Failed to update listing', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; listingId: string }> }
) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser) return apiUnauthorized();

    const { id, listingId } = await params;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(listings)
      .where(and(eq(listings.id, listingId), eq(listings.providerId, id)))
      .limit(1);

    if (!existing) return apiNotFound('Listing not found');

    const [provider] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, id))
      .limit(1);

    if (!provider || (provider.userId !== authUser.id && authUser.role !== 'admin')) {
      return apiForbidden('You can only archive your own listings');
    }

    const [archived] = await db
      .update(listings)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(listings.id, listingId))
      .returning();

    await db
      .update(searchIndex)
      .set({ isActive: false })
      .where(eq(searchIndex.listingId, listingId));

    return apiSuccess(archived);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Archive listing error:', error);
    return apiError('Failed to archive listing', 500);
  }
}
