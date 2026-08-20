import { NextRequest } from 'next/server';
import { getDb, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, parseJsonBody } from '@/lib/api-helpers';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiUnauthorized();

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const { currentPassword, newPassword } = parsed.data;

    const db = getDb();
    const [fullUser] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!fullUser) return apiUnauthorized();

    const valid = await verifyPassword(currentPassword, fullUser.passwordHash);
    if (!valid) {
      return apiError('Current password is incorrect', 400);
    }

    const newHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return apiSuccess({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Change password error:', error);
    return apiError('Failed to change password', 500);
  }
}
