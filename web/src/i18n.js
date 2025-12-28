import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import he from './locales/he.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he }
    },
    lng: 'he', // ברירת מחדל התחלתית (תדרס מיד ע"י ה-Provider)
    fallbackLng: 'he',
    interpolation: {
      escapeValue: false
    },
    // 👇 מחקנו את ה-detection! אנחנו לא רוצים שהספרייה תנחש לבד.
    react: {
      useSuspense: false // מונע בעיות בטעינה ראשונית ב-Next.js
    }
  });

export default i18n;