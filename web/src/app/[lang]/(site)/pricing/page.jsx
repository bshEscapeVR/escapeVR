'use client';

import React from 'react';
import PricingSection from '../../../../components/PricingSection';
import Footer from '../../../../components/Footer';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans selection:bg-brand-neon selection:text-white">
      <main className="pt-20">
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
