import { NextRequest } from 'next/server';
import { getDb, providerApplications } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiUnauthorized();

    const db = getDb();

    const applications = await db
      .select()
      .from(providerApplications)
      .where(eq(providerApplications.userId, user.id))
      .orderBy(desc(providerApplications.createdAt));

    if (applications.length === 0) {
      return apiNotFound('No applications found');
    }

    return apiSuccess(applications);
  } catch (error) {
    console.error('Get application status error:', error);
    return apiError('Failed to get application status', 500);
  }
}
