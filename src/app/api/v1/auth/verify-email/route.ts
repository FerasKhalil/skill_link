import { NextRequest } from 'next/server';
import { getDb, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, parseJsonBody } from '@/lib/api-helpers';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiUnauthorized();

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const db = getDb();
    const [fullUser] = await db
      .select({ emailVerifyToken: users.emailVerifyToken })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!fullUser) return apiUnauthorized();

    if (fullUser.emailVerifyToken !== parsed.data.token) {
      return apiError('Invalid or expired verification token', 400);
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerifyToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return apiSuccess({ message: 'Email verified successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Verify email error:', error);
    return apiError('Failed to verify email', 500);
  }
}
