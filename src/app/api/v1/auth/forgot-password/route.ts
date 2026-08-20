import { NextRequest } from 'next/server';
import { getDb, users } from '@/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError, parseJsonBody } from '@/lib/api-helpers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    if (!body?.email) return apiError('Email is required', 400);

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, body.email.toLowerCase())).limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return apiSuccess({ message: 'If an account exists with this email, a reset link has been sent.' });
    }

    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

    await db.update(users).set({
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    // In production, send email with reset link
    console.log(`Password reset token for ${user.email}: ${resetToken}`);

    return apiSuccess({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return apiError('Request failed', 500);
  }
}
