'use client';

import React from 'react';
import Hero from '../../../components/Hero';
import AboutSection from '../../../components/AboutSection';
import RoomsGrid from '../../../components/RoomsGrid';
import TestimonialsSection from '../../../components/TestimonialsSection';
import LocationSection from '../../../components/LocationSection';
import ContactSection from '../../../components/ContactSection';
import Footer from '../../../components/Footer';


export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans selection:bg-brand-neon selection:text-white">
      <main>
        <Hero />
        <h1 style={{ color: 'red', fontSize: '50px', zIndex: 9999, position: 'relative' }}>
        
        </h1>
        <AboutSection />
        <RoomsGrid />
        <TestimonialsSection />
        <LocationSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
