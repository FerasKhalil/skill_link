import { NextRequest } from 'next/server';
import { getDb, searchIndex, listings, providerProfiles, users, categories } from '@/db';
import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';
import { apiError, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';

const MIN_QUERY_LENGTH = 2;

function buildWordMatchCondition(query: string) {
  const words = query.trim().split(/\s+/).filter(w => w.length >= MIN_QUERY_LENGTH);
  if (words.length === 0) return null;

  const wordConditions = words.map(word => {
    const pattern = `\\m${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
    return sql`(
      ${listings.titleEn} ~* ${pattern}
      OR ${listings.titleAr} ~* ${pattern}
      OR ${listings.descriptionEn} ~* ${pattern}
      OR ${listings.descriptionAr} ~* ${pattern}
      OR ${users.displayName} ~* ${pattern}
      OR ${users.firstName} ~* ${pattern}
      OR ${users.lastName} ~* ${pattern}
      OR ${providerProfiles.profession} ~* ${pattern}
      OR ${providerProfiles.title} ~* ${pattern}
      OR ${searchIndex.textEn} ~* ${pattern}
      OR ${searchIndex.textAr} ~* ${pattern}
    )`;
  });

  return sql.join(wordConditions, sql` AND `);
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q')?.trim() || '';
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
      eq(listings.status, 'active'),
    ];

    if (q) {
      if (q.length < MIN_QUERY_LENGTH) {
        return paginatedResponse([], 0, page, limit);
      }
      const matchCondition = buildWordMatchCondition(q);
      if (matchCondition) {
        conditions.push(matchCondition);
      }
    }

    if (category) {
      conditions.push(
        sql`(${listings.categoryId} IN (SELECT c2.id FROM categories c2 WHERE c2.slug = ${category} OR c2.id = (SELECT c3.parent_id FROM categories c3 WHERE c3.slug = ${category})))`
      );
    }

    if (subcategory) {
      conditions.push(eq(listings.subcategoryId, subcategory));
    }

    if (minPrice) {
      conditions.push(gte(listings.priceMin, minPrice));
    }

    if (maxPrice) {
      conditions.push(lte(listings.priceMax, maxPrice));
    }

    if (minRating) {
      conditions.push(gte(providerProfiles.ratingAvg, minRating));
    }

    if (verified === 'true') {
      conditions.push(eq(providerProfiles.verificationStatus, 'approved'));
    }

    if (deliveryMode) {
      if (deliveryMode === 'onsite' || deliveryMode === 'remote') {
        conditions.push(sql`${listings.deliveryModes} @> ${JSON.stringify([deliveryMode])}`);
      } else if (deliveryMode === 'both') {
        conditions.push(sql`cardinality(${listings.deliveryModes}) >= 2`);
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
          gte(providerProfiles.locationLat, String(latNum - latDelta)),
          lte(providerProfiles.locationLat, String(latNum + latDelta)),
          gte(providerProfiles.locationLng, String(lngNum - lngDelta)),
          lte(providerProfiles.locationLng, String(lngNum + lngDelta))
        )!
      );
    }

    const whereClause = and(...conditions);

    let orderClause;
    switch (sort) {
      case 'rating':
        orderClause = desc(providerProfiles.ratingAvg);
        break;
      case 'price_low':
        orderClause = asc(listings.priceMin);
        break;
      case 'price_high':
        orderClause = desc(listings.priceMax);
        break;
      case 'newest':
        orderClause = desc(listings.createdAt);
        break;
      case 'popular':
        orderClause = desc(listings.viewCount);
        break;
      default:
        orderClause = desc(providerProfiles.ratingAvg);
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .innerJoin(providerProfiles, eq(listings.providerId, providerProfiles.id))
      .innerJoin(users, eq(providerProfiles.userId, users.id))
      .leftJoin(searchIndex, eq(searchIndex.listingId, listings.id))
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const results = await db
      .select({
        listingId: listings.id,
        listingSlug: listings.slug,
        listingTitleEn: listings.titleEn,
        listingTitleAr: listings.titleAr,
        listingDescEn: listings.descriptionEn,
        listingDescAr: listings.descriptionAr,
        listingPriceMin: listings.priceMin,
        listingPriceMax: listings.priceMax,
        listingCurrency: listings.currency,
        listingDeliveryModes: listings.deliveryModes,
        listingServiceAreas: listings.serviceAreas,
        listingViewCount: listings.viewCount,
        listingContactCount: listings.contactCount,
        listingPublishedAt: listings.publishedAt,
        listingCreatedAt: listings.createdAt,
        providerId: providerProfiles.id,
        providerProfession: providerProfiles.profession,
        providerTitle: providerProfiles.title,
        providerRatingAvg: providerProfiles.ratingAvg,
        providerRatingCount: providerProfiles.ratingCount,
        providerBookingCount: providerProfiles.bookingCount,
        providerResponseTime: providerProfiles.responseTime,
        providerVerificationStatus: providerProfiles.verificationStatus,
        providerLocationCity: providerProfiles.locationCity,
        userId: users.id,
        userDisplayName: users.displayName,
        userAvatarUrl: users.avatarUrl,
        categoryId: categories.id,
        categorySlug: categories.slug,
        categoryNameEn: categories.nameEn,
        categoryNameAr: categories.nameAr,
      })
      .from(listings)
      .innerJoin(providerProfiles, eq(listings.providerId, providerProfiles.id))
      .innerJoin(users, eq(providerProfiles.userId, users.id))
      .leftJoin(searchIndex, eq(searchIndex.listingId, listings.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    const flat = results.map(r => ({
      id: r.listingId,
      listingId: r.listingId,
      slug: r.listingSlug,
      titleEn: r.listingTitleEn,
      titleAr: r.listingTitleAr,
      descriptionEn: r.listingDescEn,
      descriptionAr: r.listingDescAr,
      providerId: r.providerId,
      providerName: r.userDisplayName,
      providerAvatar: r.userAvatarUrl,
      providerVerified: r.providerVerificationStatus === 'approved',
      categoryName: r.categoryNameEn,
      subcategoryName: null,
      ratingAvg: r.providerRatingAvg ? parseFloat(String(r.providerRatingAvg)) : 0,
      ratingCount: r.providerRatingCount ?? 0,
      priceMin: r.listingPriceMin ? parseFloat(String(r.listingPriceMin)) : null,
      priceMax: r.listingPriceMax ? parseFloat(String(r.listingPriceMax)) : null,
      currency: r.listingCurrency,
      deliveryModes: r.listingDeliveryModes ?? [],
      serviceAreas: r.listingServiceAreas ?? [],
      locationCity: r.providerLocationCity,
    }));

    return paginatedResponse(flat, total, page, limit);
  } catch (error: any) {
    console.error('Search error:', error?.message, error?.stack);
    return apiError(error?.message || 'Search failed', 500);
  }
}
