import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'skilllink_session';

const PUBLIC_PATHS = [
  '/api/v1/auth',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isAdminPath = pathname.includes('/admin');

  if (isAdminPath) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const url = new URL('/en/sign-in', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
