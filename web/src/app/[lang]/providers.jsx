'use client';

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { SettingsProvider } from '../../context/SettingsContext';
import { BookingProvider } from '../../context/BookingContext';

export default function Providers({ children, lang }) {
  // Sync i18n language AFTER render (safe, no side-effects during render)
  // The key={lang} on I18nextProvider forces remount on language change,
  // ensuring all children get fresh translations
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