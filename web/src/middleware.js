import { NextResponse } from 'next/server';

const locales = ['he', 'en'];
const defaultLocale = 'he';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if pathname already has a locale prefix
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) {
    // Locale present - continue
    return NextResponse.next();
  }

  // No locale - redirect to default locale
  const newUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
  newUrl.search = request.nextUrl.search;

  return NextResponse.redirect(newUrl);
}

export const config = {
  // Only run middleware on page routes, exclude static files and internals
  matcher: [
    '/((?!api|v1|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)',
  ],
};
