'use client';

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { SettingsProvider } from '../../context/SettingsContext';
import { BookingProvider } from '../../context/BookingContext';

export default function Providers({ children, lang }) {
  // SYNCHRONOUS: Direct mutation before children render
  // Sets i18n.language WITHOUT emitting events (no React state updates)
  // This ensures t() returns correct translations on first render → Hydration matches
  if (i18n.language !== lang) {
    i18n.language = lang;
    i18n.languages = [lang];
  }

  // SAFE FALLBACK: Proper sync after render for i18next plugins/internals
  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang]);

  return (
    <I18nextProvider i18n={i18n} key={lang}>
      <SettingsProvider lang={lang}>
        <BookingProvider>
          {children}
        </BookingProvider>
      </SettingsProvider>
    </I18nextProvider>
  );
}