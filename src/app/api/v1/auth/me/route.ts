import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, providerProfiles } from '@/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiUnauthorized } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiUnauthorized();

    let providerProfile = null;
    if (user.role === 'provider') {
      const db = getDb();
      const [profile] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, user.id)).limit(1);
      if (profile) {
        providerProfile = {
          id: profile.id,
          verificationStatus: profile.verificationStatus,
          ratingAvg: profile.ratingAvg,
          ratingCount: profile.ratingCount,
          bookingCount: profile.bookingCount,
          profession: profile.profession,
          locationCity: profile.locationCity,
        };
      }
    }

    return apiSuccess({ user, providerProfile });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Get user error:', error);
    return apiUnauthorized();
  }
}
