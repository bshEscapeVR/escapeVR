'use client';

import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { SettingsProvider } from '../../context/SettingsContext';
import { BookingProvider } from '../../context/BookingContext';

export default function Providers({ children, lang }) {
  // Synchronously set language BEFORE any child component renders
  // This ensures useTranslation() returns correct translations on first render
  // preventing hydration mismatch between server and client
  if (i18n.language !== lang) {
    i18n.changeLanguage(lang);
  }

  return (
    <I18nextProvider i18n={i18n}>
      <SettingsProvider lang={lang}>
        <BookingProvider>
          {children}
        </BookingProvider>
      </SettingsProvider>
    </I18nextProvider>
  );
}