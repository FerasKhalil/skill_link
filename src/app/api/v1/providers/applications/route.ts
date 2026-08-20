import { NextRequest } from 'next/server';
import { getDb, providerApplications, providerProfiles } from '@/db';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiConflict, parseJsonBody } from '@/lib/api-helpers';
import { z } from 'zod';

const applicationSchema = z.object({
  profession: z.string().min(1, 'Profession is required').max(200),
  title: z.string().max(200).optional(),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(2000),
  bioAr: z.string().max(2000).optional(),
  experience: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  gender: z.string().max(20).optional(),
  identityDocUrl: z.string().url().optional(),
  affiliationDocUrl: z.string().url().optional(),
  affiliationOrg: z.string().max(200).optional(),
  termsAccepted: z.literal(true, { message: 'You must accept the terms to apply' }),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role === 'provider') {
      return apiError('You are already a provider', 409);
    }

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const db = getDb();

    const [pendingApp] = await db
      .select()
      .from(providerApplications)
      .where(
        eq(providerApplications.userId, user.id) &&
        eq(providerApplications.status, 'pending')
      )
      .limit(1);

    if (pendingApp) {
      return apiConflict('You already have a pending application');
    }

    const data = parsed.data;

    const [profile] = await db
      .insert(providerProfiles)
      .values({
        userId: user.id,
        profession: data.profession,
        title: data.title || null,
        bio: data.bio,
        bioAr: data.bioAr || null,
        experience: data.experience || null,
        yearsExperience: data.yearsExperience ?? null,
        gender: data.gender || null,
        identityDocUrl: data.identityDocUrl || null,
        affiliationDocUrl: data.affiliationDocUrl || null,
        affiliationOrg: data.affiliationOrg || null,
        verificationStatus: 'pending',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      })
      .returning();

    const [application] = await db
      .insert(providerApplications)
      .values({
        userId: user.id,
        providerProfileId: profile.id,
        status: 'pending',
        profession: data.profession,
        title: data.title || null,
        bio: data.bio,
        bioAr: data.bioAr || null,
        experience: data.experience || null,
        yearsExperience: data.yearsExperience ?? null,
        gender: data.gender || null,
        identityDocUrl: data.identityDocUrl || null,
        affiliationDocUrl: data.affiliationDocUrl || null,
        affiliationOrg: data.affiliationOrg || null,
        termsAccepted: true,
        submittedAt: new Date(),
      })
      .returning();

    return apiSuccess({ application, providerProfile: profile }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Submit application error:', error);
    return apiError('Failed to submit application', 500);
  }
}
