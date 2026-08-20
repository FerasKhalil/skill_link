import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getDb, users, sessions } from '@/db';
import { eq, and, gt } from 'drizzle-orm';

const AUTH_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me');
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'skilllink_session';
const MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || '604800000', 10);

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
  locale: string;
  role: 'customer' | 'provider' | 'admin' | 'moderator';
  accountState: 'active' | 'suspended' | 'deactivated';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setSubject(userId)
    .sign(AUTH_SECRET);
  return token;
}

export async function verifySessionToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    return { userId: payload.sub as string };
  } catch {
    return null;
  }
}

export async function createSession(userId: string, request?: NextRequest): Promise<string> {
  const db = getDb();
  const token = await createSessionToken(userId);

  await db.insert(sessions).values({
    userId,
    token,
    userAgent: request?.headers.get('user-agent') || null,
    ipAddress: request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    expiresAt: new Date(Date.now() + MAX_AGE),
  });

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE / 1000,
    path: '/',
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(request?: NextRequest): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = request
      ? request.cookies.get(COOKIE_NAME)?.value
      : cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    const db = getDb();
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (!session) return null;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user || user.accountState !== 'active') return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      role: user.role,
      accountState: user.accountState,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(request?: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireAdmin(request?: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== 'admin' && user.role !== 'moderator') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export async function requireProvider(request?: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== 'provider' && user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
