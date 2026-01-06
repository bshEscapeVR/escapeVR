'use client';

import React from 'react';
import ContactSection from '../../../../components/ContactSection';
import Footer from '../../../../components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans selection:bg-brand-neon selection:text-white">
      <main className="pt-20">
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
