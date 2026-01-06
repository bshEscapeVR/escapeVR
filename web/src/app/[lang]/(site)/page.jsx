'use client';

import React from 'react';
import Hero from '../../../components/Hero';
import AboutSection from '../../../components/AboutSection';
import RoomsGrid from '../../../components/RoomsGrid';
import TestimonialsSection from '../../../components/TestimonialsSection';
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
        <LocationSection />
      </main>

      <Footer />
    </div>
  );
}
