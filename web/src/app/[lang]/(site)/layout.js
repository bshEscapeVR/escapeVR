'use client';

import Navbar from '../../../components/Navbar';
import ContactPopup from '../../../components/ContactPopup';
import WelcomePopup from '../../../components/WelcomePopup';
import CookieBanner from '../../../components/CookieBanner';
import FloatingContactButton from '../../../components/FloatingContactButton';
// 1. הוספת שורת הייבוא
import { GoogleAnalytics } from '@next/third-parties/google';

export default function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      <ContactPopup />
      <WelcomePopup />
      {children}
      <FloatingContactButton />
      <CookieBanner />

      {/* 2. הוספת רכיב המעקב (לא נראה לעין) */}
      <GoogleAnalytics gaId="G-14PQ97YGGM" />
    </>
  );
}
