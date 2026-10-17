'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';

// כפתור צף קבוע בפינת המסך - מוביל לעמוד צור קשר
const FloatingContactButton = () => {
    const { t } = useTranslation();
    const { language } = useSettings();
    const pathname = usePathname();

    // לא מציגים בניהול ובעמוד צור קשר עצמו
    if (pathname?.includes('/admin') || pathname?.endsWith('/contact')) return null;

    return (
        <Link
            href={`/${language}/contact`}
            aria-label={t('navbar.contact')}
            title={t('navbar.contact')}
            className="fixed bottom-5 left-5 z-[80] w-14 h-14 md:w-16 md:h-16 group"
        >
            {/* הילה פועמת - גדלה וקטנה */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 opacity-40 animate-pulse-ring" />

            {/* הכפתור עצמו */}
            <span className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 shadow-lg shadow-purple-500/40 group-hover:scale-110 transition-transform">
                <MessageSquare className="text-white" size={26} />
            </span>
        </Link>
    );
};

export default FloatingContactButton;
