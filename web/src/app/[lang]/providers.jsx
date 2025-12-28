'use client';

import React from 'react';
import { I18nextProvider } from 'react-i18next';
// עולים שתי רמות למעלה כדי להגיע ל-src
import i18n from '../../i18n'; 
import { SettingsProvider } from '../../context/SettingsContext';
import { BookingProvider } from '../../context/BookingContext';

export default function Providers({ children, lang }) {
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