import { NextRequest } from 'next/server';
import { getDb, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, parseJsonBody } from '@/lib/api-helpers';
import { z } from 'zod';

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().max(200).optional(),
  phone: z.string().max(20).optional().nullable(),
  locale: z.enum(['en', 'ar']).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiUnauthorized();

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const db = getDb();
    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.locale !== undefined) updateData.locale = data.locale;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl || null;

    if (Object.keys(updateData).length === 0) {
      return apiError('No fields to update', 400);
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        phone: users.phone,
        locale: users.locale,
        role: users.role,
        accountState: users.accountState,
      });

    return apiSuccess(updated);
  } catch (error) {
    console.error('Update user error:', error);
    return apiError('Failed to update profile', 500);
  }
}
