import { NextRequest } from 'next/server';
import { getDb, users, providerProfiles } from '@/db';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth';
import { apiSuccess, apiError, parseJsonBody } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { email, password } = body;
    if (!email || !password) {
      return apiError('Email and password are required', 400);
    }

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

    if (!user) {
      return apiError('Invalid email or password', 401);
    }

    if (user.accountState !== 'active') {
      return apiError('Account is not active', 403);
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return apiError('Invalid email or password', 401);
    }

    await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));

    const token = await createSession(user.id, request);
    await setSessionCookie(token);

    let providerProfile = null;
    if (user.role === 'provider') {
      const [profile] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, user.id)).limit(1);
      providerProfile = profile ? {
        id: profile.id,
        verificationStatus: profile.verificationStatus,
        ratingAvg: profile.ratingAvg,
      } : null;
    }

    return apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        locale: user.locale,
        role: user.role,
        accountState: user.accountState,
      },
      providerProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    return apiError('Login failed', 500);
  }
}
