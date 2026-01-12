'use client';

import Navbar from '../../../components/Navbar';
import ContactPopup from '../../../components/ContactPopup';
import WelcomePopup from '../../../components/WelcomePopup';

export default function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      <ContactPopup />
      <WelcomePopup />
      {children}
    </>
  );
}
