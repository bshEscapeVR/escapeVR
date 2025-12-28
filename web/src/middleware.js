import { NextResponse } from 'next/server';

const locales = ['he', 'en'];
const defaultLocale = 'he';

// Paths that should not be redirected (static files, api routes, etc.)
const excludedPaths = [
    '/api',
    '/_next',
    '/favicon.ico',
    '/images',
    '/fonts',
    '/hex-pattern.svg',
    '/placeholder.jpg',
];

function getLocaleFromPath(pathname) {
    const segments = pathname.split('/');
    const potentialLocale = segments[1];
    return locales.includes(potentialLocale) ? potentialLocale : null;
}

function getPreferredLocale(request) {
    // 1. Check cookie first
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    if (cookieLocale && locales.includes(cookieLocale)) {
        return cookieLocale;
    }

    // 2. Check Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language');
    if (acceptLanguage) {
        // Parse Accept-Language header (e.g., "en-US,en;q=0.9,he;q=0.8")
        const languages = acceptLanguage.split(',').map(lang => {
            const [code] = lang.trim().split(';');
            return code.split('-')[0].toLowerCase();
        });

        for (const lang of languages) {
            if (locales.includes(lang)) {
                return lang;
            }
        }
    }

    // 3. Default to Hebrew
    return defaultLocale;
}

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Skip excluded paths
    if (excludedPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Check if locale is already in path
    const pathnameLocale = getLocaleFromPath(pathname);

    if (pathnameLocale) {
        // Locale is present, continue with the request
        // Set the locale cookie for consistency
        const response = NextResponse.next();
        response.cookies.set('NEXT_LOCALE', pathnameLocale, {
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/',
        });
        return response;
    }

    // No locale in path - redirect to the preferred locale
    const preferredLocale = getPreferredLocale(request);

    // Build the new URL with locale prefix
    const newUrl = new URL(`/${preferredLocale}${pathname}`, request.url);

    // Preserve query parameters
    newUrl.search = request.nextUrl.search;

    // Redirect to the new URL
    const response = NextResponse.redirect(newUrl);
    response.cookies.set('NEXT_LOCALE', preferredLocale, {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
    });

    return response;
}

export const config = {
    // Match all paths except static files
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
