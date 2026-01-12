'use client';

import React, { useEffect } from 'react';
import Hero from '../../../components/Hero';
import AboutSection from '../../../components/AboutSection';
import RoomsGrid from '../../../components/RoomsGrid';
import TestimonialsSection from '../../../components/TestimonialsSection';
import LocationSection from '../../../components/LocationSection';
import Footer from '../../../components/Footer';


export default function HomePage() {
  // גלילה לאלמנט לפי hash ב-URL (למשל #rooms)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

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
