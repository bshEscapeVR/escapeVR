import "../globals.css";
import Providers from "./providers";

// Force dynamic rendering (required for fetch with no-store)
export const dynamic = 'force-dynamic';

// API URL from environment variable (server-side)
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// CRITICAL: Fail fast if env var is missing
if (!API_URL) {
  throw new Error('CRITICAL: NEXT_PUBLIC_API_URL is missing on server');
}

// --- Server Side Data Fetching ---
async function getSettingsFromServer() {
  try {
    const res = await fetch(`${API_URL}/v1/settings`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error('Settings Fetch Error:', error);
    return null;
  }
}

// --- Dynamic Metadata Generation ---
export async function generateMetadata({ params }) {
  const { lang } = await params;
  const settings = await getSettingsFromServer();

  const siteName = settings?.general?.siteName?.[lang] || settings?.general?.siteName?.he || "VR Escape Reality";
  const title = settings?.seo?.home?.title?.[lang] || settings?.seo?.home?.title?.he || siteName;
  const description = settings?.seo?.home?.description?.[lang] || settings?.seo?.home?.description?.he || "החוויה הוירטואלית המתקדמת בישראל";
  const keywords = settings?.seo?.home?.keywords?.[lang] || settings?.seo?.home?.keywords?.he || "חדר בריחה, מציאות מדומה, VR, אטרקציות";

  let heroImage = settings?.media?.heroImage || '/placeholder.jpg';
  if (!heroImage.startsWith('http')) {
    const cleanPath = heroImage.replace('../../public', '').replace('/public', '');
    heroImage = `${API_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  }

  return {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description: description,
    keywords: keywords,
    openGraph: {
      title: title,
      description: description,
      type: 'website',
      locale: lang === 'he' ? 'he_IL' : 'en_US',
      siteName: siteName,
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    icons: {
      icon: settings?.general?.faviconUrl || '/favicon.ico',
    },
  };
}

export async function generateStaticParams() {
  return [{ lang: 'he' }, { lang: 'en' }];
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  // Fetch settings on server and pass to client
  const initialSettings = await getSettingsFromServer();

  return (
    <html lang={lang} dir={dir}>
      <body className="antialiased">
        <Providers lang={lang} initialSettings={initialSettings}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
