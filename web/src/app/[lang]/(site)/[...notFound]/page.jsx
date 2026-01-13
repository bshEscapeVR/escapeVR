'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useSettings } from '../../../../context/SettingsContext';

export default function CatchAllNotFound() {
  const { language } = useSettings();

  const content = {
    he: {
      title: "אופס! נתקעת במציאות הלא נכונה",
      description: "העמוד שחיפשת לא קיים, או שאולי הוא עבר למימד אחר?",
      button: "חזרה הביתה"
    },
    en: {
      title: "Oops! Stuck in the wrong reality",
      description: "The page you're looking for doesn't exist, or maybe it moved to another dimension?",
      button: "Back Home"
    }
  };

  const t = content[language] || content.he;

  return (
    <div className="min-h-screen bg-[#0f0518] flex items-center justify-center text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hex-pattern.svg')] opacity-5"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-primary/20 rounded-full blur-[120px]"></div>

        <div className="relative z-10">
            <h1 className="text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-neon leading-none">
                404
            </h1>
            <h2 className="text-3xl font-bold text-white mb-4">{t.title}</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                {t.description}
            </p>

            <Link
                href={`/${language}`}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg border border-white/20 transition-all backdrop-blur-md"
            >
                <Home size={20} />
                {t.button}
            </Link>
        </div>
    </div>
  );
}
