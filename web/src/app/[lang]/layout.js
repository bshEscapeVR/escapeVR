import "../globals.css";
import Providers from "./providers";

// Force dynamic rendering (required for fetch with no-store)
export const dynamic = 'force-dynamic';

// API URL from environment variable
const API_URL = 'https://escapevr-server.onrender.com';
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

// Cloudinary favicon resizer - converts any uploaded image to proper favicon size
function toFaviconUrl(url, size) {
  if (!url) return '/favicon.ico';
  // Insert Cloudinary transformation for resize + PNG format
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,f_png/`);
  }
  // Non-Cloudinary URL - return as-is
  return url;
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
    icons: settings?.general?.faviconUrl
      ? {
          icon: [
            { url: toFaviconUrl(settings.general.faviconUrl, 32), sizes: '32x32', type: 'image/png' },
            { url: toFaviconUrl(settings.general.faviconUrl, 16), sizes: '16x16', type: 'image/png' },
          ],
          apple: [
            { url: toFaviconUrl(settings.general.faviconUrl, 180), sizes: '180x180', type: 'image/png' },
          ],
        }
      : { icon: '/favicon.ico' },
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
