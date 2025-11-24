
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/chat', '/settings', '/subscribe'];
const SESSION_COOKIE_NAME = 'echoMessageSessionToken'; // Standardized cookie name

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/signup');

  console.log(`[Middleware] Path: ${pathname}, Token: ${sessionToken ? 'Exists' : 'Missing'}`);

  if (isProtectedPath && !sessionToken) {
    console.log(`[Middleware] Protected path ${pathname} without token. Redirecting to /login.`);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath && sessionToken) {
    console.log(`[Middleware] Auth path ${pathname} with token. Redirecting to /chat.`);
    const url = request.nextUrl.clone();
    url.pathname = '/chat';
    return NextResponse.redirect(url);
  }

  console.log(`[Middleware] Allowing request for ${pathname}.`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|verify-email).*)',
  ],
};

