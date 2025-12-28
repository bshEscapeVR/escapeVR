'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsService } from '../services';
import { useRouter } from 'next/navigation'; 

const SettingsContext = createContext();

export const SettingsProvider = ({ children, lang }) => {
    const { i18n } = useTranslation();
    const router = useRouter();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- התיקון: שינוי שפה בטוח בתוך useEffect ---
    // זה קורה מיד אחרי שהדף עולה, ומונע את הקריסה.
    useEffect(() => {
        if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
        }
    }, [lang, i18n]);

    // ניהול כיוון (RTL/LTR)
    useEffect(() => {
        const dir = lang === 'he' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;
    }, [lang]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await settingsService.get();
                setSettings(data);
            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

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
        if (typeof obj === 'object' && (obj.he || obj.en)) {
            return obj[lang] || obj['he'] || '';
        }
        return obj;
    };

    const getImg = (path) => {
        if (!path) return '/placeholder.jpg';
        // Absolute URLs (Cloudinary, CDN, etc.) - return as-is
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        // Legacy local paths - prepend API URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        let cleanPath = path.replace(/\.\.\//g, '').replace('public/', '').replace('/public/', '/');
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        return `${apiUrl}${cleanPath}`;
    };

    return (
        <SettingsContext.Provider value={{
            settings, loading, language: lang, toggleLanguage, t, getImg
        }}>
            {/* 
                הוספת key שמבוסס על השפה מבטיחה שכל הילדים יתרעננו 
                אם יש חוסר התאמה בשפה, ומונעת בעיות תצוגה
            */}
            <div key={lang}>
                {children}
            </div>
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);