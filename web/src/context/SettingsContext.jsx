'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SettingsContext = createContext();

export const SettingsProvider = ({ children, lang, initialSettings }) => {
    const router = useRouter();

    // Initialize with server-fetched settings (no client fetch needed)
    const [settings, setSettings] = useState(initialSettings);
    const [loading, setLoading] = useState(false);

    // Set document direction (RTL/LTR) based on language
    useEffect(() => {
        document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    }, [lang]);

    const toggleLanguage = () => {
        const newLang = lang === 'he' ? 'en' : 'he';
        const currentPath = window.location.pathname;
        let newPath;
        if (currentPath.startsWith(`/${lang}`)) {
            newPath = currentPath.replace(`/${lang}`, `/${newLang}`);
        } else {
            newPath = `/${newLang}${currentPath}`;
        }
        router.push(newPath);
    };

    const t = (obj) => {
        if (!obj) return '';
        if (typeof obj === 'object' && ('he' in obj || 'en' in obj)) {
            return obj[lang] || obj['he'] || obj['en'] || '';
        }
        if (typeof obj === 'object') {
            return '';
        }
        return obj;
    };

    const getImg = (path) => {
        if (!path) return '/placeholder.jpg';

        // Handle Cloudinary URLs
        if (path.includes('cloudinary.com')) {
            // SVG files (raw resource type) - return as-is, no transformations
            if (path.includes('/raw/') || path.toLowerCase().endsWith('.svg')) {
                return path;
            }

            // GIF files - return as-is to preserve animation
            if (path.toLowerCase().endsWith('.gif')) {
                return path;
            }

            // Regular images - inject f_auto,q_auto for optimization
            if (!path.includes('f_auto') && !path.includes('q_auto')) {
                return path.replace('/upload/', '/upload/f_auto,q_auto/');
            }
            return path;
        }

        // Other external URLs - return as-is
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // Legacy local paths - prepend API URL from env var
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://escapevr-server.onrender.com';
        let cleanPath = path.replace(/\.\.\//g, '').replace('public/', '').replace('/public/', '/');
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        return `${apiUrl}${cleanPath}`;
    };

    return (
        <SettingsContext.Provider value={{
            settings, setSettings, loading, language: lang, toggleLanguage, t, getImg
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
