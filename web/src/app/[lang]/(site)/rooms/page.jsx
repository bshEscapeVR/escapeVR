'use client';

import React from 'react';
import RoomsGrid from '../../../../components/RoomsGrid';
import Footer from '../../../../components/Footer';

export default function RoomsPage() {
  return (
    <div className="min-h-screen text-brand-text font-sans selection:bg-brand-neon selection:text-white">
      <main className="pt-16">
        <RoomsGrid />
      </main>
      <Footer />
    </div>
  );
}
