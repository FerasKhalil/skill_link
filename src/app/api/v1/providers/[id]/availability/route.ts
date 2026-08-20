import { NextRequest } from 'next/server';
import { getDb, providerProfiles, availabilityRules } from '@/db';
import { eq } from 'drizzle-orm';
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

const availabilityRuleSchema = z.object({
  listingId: z.string().uuid().nullable().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  capacity: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

const availabilitySchema = z.array(availabilityRuleSchema);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [provider] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, id))
      .limit(1);

    if (!provider) return apiNotFound('Provider not found');

    const rules = await db
      .select()
      .from(availabilityRules)
      .where(eq(availabilityRules.providerId, id));

    return apiSuccess(rules);
  } catch (error) {
    console.error('Get availability error:', error);
    return apiError('Failed to get availability', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser(request);
    if (!authUser) return apiUnauthorized();

    const { id } = await params;
    const db = getDb();

    const [provider] = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, id))
      .limit(1);

    if (!provider) return apiNotFound('Provider not found');
    if (provider.userId !== authUser.id && authUser.role !== 'admin') {
      return apiForbidden('You can only update your own availability');
    }

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const parsed = availabilitySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const rules = parsed.data;

    for (const rule of rules) {
      if (rule.startTime >= rule.endTime) {
        return apiError('End time must be after start time', 400);
      }
    }

    await db
      .delete(availabilityRules)
      .where(eq(availabilityRules.providerId, id));

    const insertedRules = rules.length > 0
      ? await db
          .insert(availabilityRules)
          .values(
            rules.map((rule) => ({
              providerId: id,
              listingId: rule.listingId || null,
              dayOfWeek: rule.dayOfWeek,
              startTime: rule.startTime,
              endTime: rule.endTime,
              capacity: rule.capacity,
              isActive: rule.isActive,
            }))
          )
          .returning()
      : [];

    return apiSuccess(insertedRules);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Update availability error:', error);
    return apiError('Failed to update availability', 500);
  }
}
