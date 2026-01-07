'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // 👈 תוספת חשובה
import { Menu, X, Globe, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../context/BookingContext';
import { useSettings } from '../context/SettingsContext';
import { authService } from '../services';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { openBooking } = useBooking();
  const { settings, getImg, t: tDB, language, toggleLanguage } = useSettings();
  const pathname = usePathname(); // 👈 קבלת הנתיב הנוכחי
  
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAdmin(authService.isAuthenticated());
  }, []);

  const navLinks = [
    { name: t('navbar.home'), href: `/${language}` },
    { name: t('navbar.rooms'), href: `/${language}#rooms` }, // מפנה ל-ID של החדרים
    { name: t('navbar.contact'), href: `/${language}/contact` }, // מפנה לעמוד צור קשר
  ];

  // 👇 הפונקציה החכמה לגלילה
  const handleScroll = (e, href) => {
      // תמיד סוגרים את המובייל
      setIsOpen(false);

      // אם זה קישור עוגן (מכיל #)
      if (href.includes('#')) {
          const [path, hash] = href.split('#');
          
          // בדיקה: האם אנחנו כבר נמצאים בעמוד שאליו הקישור מוביל?
          // (למשל: אנחנו ב-/he והקישור הוא /he#rooms)
          if (pathname === path) {
              e.preventDefault(); // מבטל את הטעינה מחדש
              const elem = document.getElementById(hash); // מחפש את האלמנט (rooms)
              if (elem) {
                  elem.scrollIntoView({ behavior: 'smooth' }); // גלילה חלקה
              }
          }
      }
  };

  return (
    <>
    <nav className="fixed w-full z-50 bg-[#2d1052]/50 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href={`/${language}`} className="flex-shrink-0 flex items-center cursor-pointer group z-50 relative">
            {settings?.general?.logoUrl ? (
                <img src={getImg(settings.general.logoUrl)} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
                <div className="w-12 h-12 rounded-full bg-brand-neon flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform duration-300">
                   <span className="font-bold text-white text-base">VR</span>
                </div>
            )}
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8 rtl:space-x-reverse">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleScroll(e, link.href)} // 👈 חיבור לפונקציית הגלילה
                  className="text-gray-300 hover:text-brand-neon hover:bg-white/5 transition-all px-3 py-2 rounded-md text-sm font-medium"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            
            {mounted && isAdmin && (
                <Link
                  href={`/${language}/admin/dashboard/home`}
                  className="flex items-center gap-2 text-yellow-400 hover:text-white text-sm font-medium transition-colors px-3 py-2 rounded-full hover:bg-white/5 border border-yellow-400/20 hover:border-white/20"
                  title={t('navbar.dashboard')}
                >
                    <LayoutDashboard size={16} />
                </Link>
            )}

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors px-3 py-2 rounded-full hover:bg-white/5"
            >
              <Globe size={16} />
              <span>{t('navbar.lang_toggle')}</span>
            </button>

            <button 
                onClick={() => openBooking()} 
                className="bg-brand-neon hover:bg-purple-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-purple-500/50"
            >
              {t('navbar.book_btn')}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4 z-50 relative">
             <button onClick={toggleLanguage} className="text-gray-400 hover:text-white font-bold text-sm">
               {t('navbar.lang_toggle_short')}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white p-2">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* --- Mobile Menu Overlay --- */}
    {isOpen && (
        <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] md:hidden animate-fade-in"
        onClick={() => setIsOpen(false)}
        ></div>
    )}

    {/* --- Mobile Menu Content (Drawer) --- */}
    <div 
        style={{ backgroundColor: '#0f0518' }} 
        className={`fixed top-0 right-0 rtl:right-auto rtl:left-0 w-[80%] max-w-sm h-full 
        border-l rtl:border-l-0 rtl:border-r border-white/10 
        transform transition-transform duration-300 ease-in-out z-[101] md:hidden flex flex-col pt-24 px-6 shadow-2xl 
        ${isOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'}`}
    >
        <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
            <Link 
                key={link.href} 
                href={link.href} 
                onClick={(e) => handleScroll(e, link.href)} // 👈 גם במובייל
                className="text-gray-200 hover:text-brand-neon px-4 py-3 rounded-xl text-lg font-medium border-b border-white/5 transition-colors"
            >
                {link.name}
            </Link>
            ))}
            
            {mounted && isAdmin && (
                <Link
                    href={`/${language}/admin/dashboard/home`}
                    onClick={() => setIsOpen(false)}
                    className="text-yellow-400 px-4 py-3 rounded-xl text-lg font-bold border-b border-white/5 flex items-center gap-2"
                >
                    <LayoutDashboard size={20} />
                    {t('navbar.dashboard')}
                </Link>
            )}
        </div>
        
        <div className="mt-8">
            <button 
                onClick={() => { openBooking(); setIsOpen(false); }} 
                className="w-full bg-brand-neon text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg"
            >
            {t('navbar.book_btn')}
            </button>
        </div>

        <div className="mt-auto mb-8 text-center text-gray-500 text-sm">
            <p>{t('navbar.site_name')}</p>
        </div>
    </div>
    </>
  );
};

export default Navbar;