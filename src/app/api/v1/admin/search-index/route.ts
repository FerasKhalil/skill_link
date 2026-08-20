import { NextRequest } from 'next/server';
import { getDb, searchIndex, listings, providerProfiles, users } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = getDb();

    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS search_index_listing_id_idx ON search_index(listing_id)`);

    const allListings = await db
      .select({
        listingId: listings.id,
        providerId: listings.providerId,
        titleEn: listings.titleEn,
        titleAr: listings.titleAr,
        descriptionEn: listings.descriptionEn,
        descriptionAr: listings.descriptionAr,
        categoryId: listings.categoryId,
        subcategoryId: listings.subcategoryId,
        deliveryModes: listings.deliveryModes,
        serviceAreas: listings.serviceAreas,
        priceMin: listings.priceMin,
        priceMax: listings.priceMax,
        status: listings.status,
        userDisplayName: users.displayName,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        providerProfession: providerProfiles.profession,
        providerTitle: providerProfiles.title,
        providerRatingAvg: providerProfiles.ratingAvg,
        providerRatingCount: providerProfiles.ratingCount,
        providerVerificationStatus: providerProfiles.verificationStatus,
        providerLocationLat: providerProfiles.locationLat,
        providerLocationLng: providerProfiles.locationLng,
      })
      .from(listings)
      .innerJoin(providerProfiles, eq(listings.providerId, providerProfiles.id))
      .innerJoin(users, eq(providerProfiles.userId, users.id));

    let upserted = 0;

    for (const l of allListings) {
      const isActive = l.status === 'active';

      const textEn = [
        l.titleEn,
        l.descriptionEn,
        l.userDisplayName,
        l.userFirstName,
        l.userLastName,
        l.providerProfession,
        l.providerTitle,
      ].filter(Boolean).join(' ');

      const textAr = [
        l.titleAr,
        l.descriptionAr,
        l.userDisplayName,
      ].filter(Boolean).join(' ');

      const isVerified = l.providerVerificationStatus === 'approved';

      await db
        .insert(searchIndex)
        .values({
          listingId: l.listingId,
          providerId: l.providerId,
          textEn,
          textAr,
          categoryId: l.categoryId,
          subcategoryId: l.subcategoryId,
          ratingAvg: l.providerRatingAvg ? String(l.providerRatingAvg) : '0',
          ratingCount: l.providerRatingCount ?? 0,
          priceMin: l.priceMin ? String(l.priceMin) : null,
          priceMax: l.priceMax ? String(l.priceMax) : null,
          deliveryModes: (l.deliveryModes as string[]) ?? [],
          serviceAreas: (l.serviceAreas as string[]) ?? [],
          isVerified,
          isActive,
          locationLat: l.providerLocationLat ? String(l.providerLocationLat) : null,
          locationLng: l.providerLocationLng ? String(l.providerLocationLng) : null,
        })
        .onConflictDoUpdate({
          target: searchIndex.listingId,
          set: {
            textEn,
            textAr,
            categoryId: l.categoryId,
            subcategoryId: l.subcategoryId,
            ratingAvg: l.providerRatingAvg ? String(l.providerRatingAvg) : '0',
            ratingCount: l.providerRatingCount ?? 0,
            priceMin: l.priceMin ? String(l.priceMin) : null,
            priceMax: l.priceMax ? String(l.priceMax) : null,
            deliveryModes: (l.deliveryModes as string[]) ?? [],
            serviceAreas: (l.serviceAreas as string[]) ?? [],
            isVerified,
            isActive,
            locationLat: l.providerLocationLat ? String(l.providerLocationLat) : null,
            locationLng: l.providerLocationLng ? String(l.providerLocationLng) : null,
          },
        });

      upserted++;
    }

    return apiSuccess({
      totalListings: allListings.length,
      upserted,
      message: `Rebuilt search index: ${upserted} entries`,
    });
  } catch (error: any) {
    console.error('Search index rebuild error:', error?.message);
    return apiError(error?.message || 'Failed to rebuild search index', 500);
  }
}
