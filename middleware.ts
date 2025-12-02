// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/chat', '/settings', '/subscribe', '/poll', '/rate-report', '/points', '/dev-tools'];
const openPaths = ['/login', '/signup', '/welcome'];
const SESSION_COOKIE_NAME = 'firebaseIdToken';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isOpenPath = openPaths.some(path => pathname.startsWith(path));

  // If trying to access a protected path without a session, redirect to login
  if (isProtectedPath && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // If logged in and trying to access an open path (like login/signup), redirect to chat
  if (isOpenPath && sessionToken) {
    // Exception: allow access to /welcome if logged in, as it's part of the onboarding flow
    if (pathname.startsWith('/welcome')) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/chat';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to all paths except for static files and internal Next.js assets
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|sounds/).*)',
  ],
};
