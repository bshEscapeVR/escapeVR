'use client';

import React from 'react';
import Hero from '../../../components/Hero';
import RoomsGrid from '../../../components/RoomsGrid';
import AboutSection from '../../../components/AboutSection';
import TestimonialsSection from '../../../components/TestimonialsSection';
import FaqSection from '../../../components/FaqSection';
import LocationSection from '../../../components/LocationSection';
import Footer from '../../../components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen text-brand-text font-sans selection:bg-brand-neon selection:text-white">
      <main>
        <Hero />
        <RoomsGrid />
        <AboutSection />
        <TestimonialsSection />
        <FaqSection />
        <LocationSection />
      </main>

      <Footer />
    </div>
  );
}
