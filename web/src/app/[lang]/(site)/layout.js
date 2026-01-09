'use client';

import Navbar from '../../../components/Navbar';
import ContactPopup from '../../../components/ContactPopup';

export default function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      <ContactPopup />
      {children}
    </>
  );
}
