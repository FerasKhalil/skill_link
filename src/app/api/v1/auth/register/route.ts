import { NextRequest } from 'next/server';
import { getDb, users } from '@/db';
import { eq } from 'drizzle-orm';
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth';
import { apiSuccess, apiError, parseJsonBody } from '@/lib/api-helpers';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional(),
  locale: z.enum(['en', 'ar']).default('en'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const { email, password, firstName, lastName, phone, locale } = parsed.data;
    const db = getDb();

    const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing) {
      return apiError('An account with this email already exists', 409);
    }

    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        phone: phone || null,
        locale,
        role: 'customer',
        accountState: 'active',
        emailVerified: false,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        locale: users.locale,
        role: users.role,
      });

    const token = await createSession(newUser.id, request);
    await setSessionCookie(token);

    return apiSuccess({
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        displayName: newUser.displayName,
        locale: newUser.locale,
        role: newUser.role,
      },
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return apiError('Registration failed', 500);
  }
}
