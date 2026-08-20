import { NextRequest } from 'next/server';
import { getDb, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiUnauthorized();

    const db = getDb();
    const [fullUser] = await db
      .select({ emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!fullUser) return apiUnauthorized();
    if (fullUser.emailVerified) {
      return apiError('Email is already verified', 400);
    }

    const verifyToken = uuidv4();
    await db
      .update(users)
      .set({ emailVerifyToken: verifyToken, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // In production, send email with verify link
    console.log(`Email verification token for ${user.email}: ${verifyToken}`);

    return apiSuccess({ message: 'Verification email sent' });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Resend verification error:', error);
    return apiError('Failed to resend verification email', 500);
  }
}
