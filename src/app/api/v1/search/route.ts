import { NextRequest } from 'next/server';
import { getDb, searchIndex, listings, providerProfiles, users, categories } from '@/db';
import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';
import { apiError, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const deliveryMode = searchParams.get('deliveryMode');
    const verified = searchParams.get('verified');
    const sort = searchParams.get('sort');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radiusKm = searchParams.get('radiusKm');

    const conditions = [
      eq(searchIndex.isActive, true),
      eq(listings.status, 'active'),
    ];

    if (q) {
      conditions.push(
        sql`(${searchIndex.textEn} ILIKE ${'%' + q + '%'} OR ${searchIndex.textAr} ILIKE ${'%' + q + '%'})`
      );
    }

    if (category) {
      conditions.push(eq(searchIndex.categoryId, category));
    }

    if (subcategory) {
      conditions.push(eq(searchIndex.subcategoryId, subcategory));
    }

    if (minPrice) {
      conditions.push(gte(searchIndex.priceMin, minPrice));
    }

    if (maxPrice) {
      conditions.push(lte(searchIndex.priceMax, maxPrice));
    }

    if (minRating) {
      conditions.push(gte(searchIndex.ratingAvg, minRating));
    }

    if (verified === 'true') {
      conditions.push(eq(searchIndex.isVerified, true));
    }

    if (deliveryMode) {
      if (deliveryMode === 'onsite' || deliveryMode === 'remote') {
        conditions.push(sql`${searchIndex.deliveryModes} @> ${JSON.stringify([deliveryMode])}`);
      } else if (deliveryMode === 'both') {
        conditions.push(sql`cardinality(${searchIndex.deliveryModes}) >= 2`);
      }
    }

    if (lat && lng && radiusKm) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusNum = parseFloat(radiusKm);
      const latDelta = radiusNum / 111;
      const lngDelta = radiusNum / (111 * Math.cos((latNum * Math.PI) / 180));
      conditions.push(
        and(
          gte(searchIndex.locationLat, String(latNum - latDelta)),
          lte(searchIndex.locationLat, String(latNum + latDelta)),
          gte(searchIndex.locationLng, String(lngNum - lngDelta)),
          lte(searchIndex.locationLng, String(lngNum + lngDelta))
        )!
      );
    }

    const whereClause = and(...conditions);

    let orderClause;
    switch (sort) {
      case 'rating':
        orderClause = desc(searchIndex.ratingAvg);
        break;
      case 'price_low':
        orderClause = asc(searchIndex.priceMin);
        break;
      case 'price_high':
        orderClause = desc(searchIndex.priceMax);
        break;
      case 'newest':
        orderClause = desc(searchIndex.createdAt);
        break;
      case 'popular':
        orderClause = desc(listings.viewCount);
        break;
      default:
        orderClause = desc(searchIndex.ratingAvg);
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(searchIndex)
      .innerJoin(listings, eq(searchIndex.listingId, listings.id))
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const results = await db
      .select({
        listing: {
          id: listings.id,
          slug: listings.slug,
          titleEn: listings.titleEn,
          titleAr: listings.titleAr,
          descriptionEn: listings.descriptionEn,
          descriptionAr: listings.descriptionAr,
          pricingModel: listings.pricingModel,
          priceMin: listings.priceMin,
          priceMax: listings.priceMax,
          currency: listings.currency,
          deliveryModes: listings.deliveryModes,
          serviceAreas: listings.serviceAreas,
          durationMin: listings.durationMin,
          durationMax: listings.durationMax,
          viewCount: listings.viewCount,
          contactCount: listings.contactCount,
          publishedAt: listings.publishedAt,
          createdAt: listings.createdAt,
        },
        provider: {
          id: providerProfiles.id,
          profession: providerProfiles.profession,
          title: providerProfiles.title,
          bio: providerProfiles.bio,
          ratingAvg: providerProfiles.ratingAvg,
          ratingCount: providerProfiles.ratingCount,
          bookingCount: providerProfiles.bookingCount,
          responseTime: providerProfiles.responseTime,
          verificationStatus: providerProfiles.verificationStatus,
          identityVerified: providerProfiles.identityVerified,
          locationCity: providerProfiles.locationCity,
          locationGovernorate: providerProfiles.locationGovernorate,
        },
        user: {
          id: users.id,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
        category: {
          id: categories.id,
          slug: categories.slug,
          nameEn: categories.nameEn,
          nameAr: categories.nameAr,
        },
        search: {
          textEn: searchIndex.textEn,
          textAr: searchIndex.textAr,
          categoryId: searchIndex.categoryId,
          subcategoryId: searchIndex.subcategoryId,
          ratingAvg: searchIndex.ratingAvg,
          ratingCount: searchIndex.ratingCount,
          isVerified: searchIndex.isVerified,
        },
      })
      .from(searchIndex)
      .innerJoin(listings, eq(searchIndex.listingId, listings.id))
      .innerJoin(providerProfiles, eq(searchIndex.providerId, providerProfiles.id))
      .innerJoin(users, eq(providerProfiles.userId, users.id))
      .leftJoin(categories, eq(searchIndex.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    return paginatedResponse(results, total, page, limit);
  } catch (error) {
    console.error('Search error:', error);
    return apiError('Search failed', 500);
  }
}
