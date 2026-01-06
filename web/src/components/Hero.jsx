'use client';

import React, { useState } from 'react';
import { Clock, Users, Zap, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // 👈 ייבוא ל-JSON
import { useSettings } from '../context/SettingsContext';
import { useBooking } from '../context/BookingContext'; // 👈 כדי שהכפתור יעבוד
import TrailerModal from './TrailerModal';

// --- אייקוני SVG לאנימציות (כמו בעיצוב של הלקוח - מעוגל ורך) ---

const LockIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* הקשת העליונה - מעוגלת */}
        <path
            d="M22 55V38C22 22 34 10 50 10C66 10 78 22 78 38V55"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
        />
        {/* גוף המנעול - מעוגל יותר */}
        <rect x="12" y="55" width="76" height="65" rx="16" stroke="currentColor" strokeWidth="8" fill="none"/>
        {/* חור המפתח - עיגול עם קו */}
        <circle cx="50" cy="82" r="10" stroke="currentColor" strokeWidth="6" fill="none"/>
        <path d="M50 92V108" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
    </svg>
);

const KeyIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* ראש המפתח - עיגול גדול */}
        <circle cx="32" cy="40" r="24" stroke="currentColor" strokeWidth="7" fill="none"/>
        <circle cx="32" cy="40" r="9" stroke="currentColor" strokeWidth="5" fill="none"/>
        {/* גוף המפתח - קו אופקי עבה */}
        <path d="M56 40H105" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
        {/* שיניים */}
        <path d="M80 40V54" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
        <path d="M95 40V48" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
    </svg>
);

const HourglassIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 70 110" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* מסגרת עליונה */}
        <path d="M8 8H62" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
        {/* מסגרת תחתונה */}
        <path d="M8 102H62" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
        {/* צורת שעון חול - X עם קצוות מעוגלים */}
        <path d="M12 14L35 55L12 96" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M58 14L35 55L58 96" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
);

const PuzzleIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* חתיכת פאזל - בולטת למעלה */}
        <path
            d="M10 25
               H28
               C28 25 30 12 40 12 C50 12 52 25 52 25
               H70
               V43
               C70 43 83 45 83 55 C83 65 70 67 70 67
               V85
               H52
               C52 85 50 72 40 72 C30 72 28 85 28 85
               H10
               V67
               C10 67 -3 65 -3 55 C-3 45 10 43 10 43
               Z"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
        />
    </svg>
);

const Hero = () => {
    const { t } = useTranslation(); // תרגום סטטי (JSON)
    const { t: tDB, settings, getImg, loading } = useSettings(); // תרגום דינמי (DB)
    const { openBooking } = useBooking();
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

    return (
        <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">

            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={getImg(settings?.media?.heroImage)}
                    alt="VR Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-brand-dark/70"></div>
            </div>

            {/* Animated Decorations - Lock, Key, Hourglass, Puzzle */}
            <div className="absolute inset-0 z-[1] pointer-events-none">

                {/* פאזל ורוד/סגול - למעלה באמצע-שמאל */}
                <div className="absolute top-[5%] left-[15%] md:left-[20%] animate-float-slow">
                    <PuzzleIcon className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-fuchsia-400/50 drop-shadow-[0_0_15px_rgba(232,121,249,0.3)]" />
                </div>

                {/* מפתח ציאן קטן - שמאל למעלה, מתחת לפאזל */}
                <div className="absolute top-[18%] left-[5%] md:left-[8%] animate-wiggle">
                    <KeyIcon className="w-16 h-12 md:w-20 md:h-14 lg:w-24 lg:h-16 text-teal-400/45 drop-shadow-[0_0_12px_rgba(45,212,191,0.3)]" />
                </div>

                {/* מנעול ציאן גדול - שמאל למטה, חלקו יוצא מהמסך */}
                <div className="absolute bottom-[5%] -left-[5%] md:-left-[2%] lg:left-0 animate-float-slow">
                    <LockIcon className="w-36 h-44 md:w-48 md:h-60 lg:w-56 lg:h-72 text-teal-500/45 drop-shadow-[0_0_30px_rgba(20,184,166,0.35)]" />
                </div>

                {/* מנעול סגול קטן - ימין למעלה */}
                <div className="absolute top-[8%] right-[8%] md:right-[12%] animate-float-reverse">
                    <LockIcon className="w-16 h-20 md:w-20 md:h-26 lg:w-24 lg:h-30 text-purple-400/35 drop-shadow-[0_0_12px_rgba(192,132,252,0.25)]" />
                </div>

                {/* מנעול סגול גדול - ימין באמצע */}
                <div className="absolute top-[30%] -right-[3%] md:right-0 lg:right-[2%] animate-float-slow">
                    <LockIcon className="w-36 h-44 md:w-48 md:h-60 lg:w-56 lg:h-72 text-purple-400/40 drop-shadow-[0_0_25px_rgba(192,132,252,0.3)]" />
                </div>

                {/* שעון חול זהוב - ימין למטה, חלקו מתחת לתוכן */}
                <div className="absolute -bottom-[5%] right-[10%] md:right-[15%] animate-wiggle z-[0]">
                    <HourglassIcon className="w-20 h-28 md:w-24 md:h-36 lg:w-28 lg:h-44 text-amber-600/50 drop-shadow-[0_0_18px_rgba(217,119,6,0.35)]" />
                </div>

            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">

                {/*
                   כותרת ראשית: מגיעה מהדאטה-בייס (ניתנת לעריכה באדמין).
                   אם טוען - מציג skeleton, אחרת מציג את התוכן האמיתי.
                */}
                {loading ? (
                    <>
                        {/* Skeleton for title */}
                        <div className="h-16 md:h-20 w-3/4 mx-auto bg-white/10 animate-pulse rounded-lg mb-4" />
                        {/* Skeleton for subtitle */}
                        <div className="h-8 w-2/3 mx-auto bg-white/10 animate-pulse rounded-lg mb-6" />
                        {/* Skeleton for description */}
                        <div className="h-5 w-full mx-auto bg-white/5 animate-pulse rounded-lg mb-2" />
                        <div className="h-5 w-4/5 mx-auto bg-white/5 animate-pulse rounded-lg mb-10" />
                    </>
                ) : (
                    <>
                        {/* כותרת ראשית - עם זוהר סגול */}
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-3 tracking-tight [text-shadow:_0_0_20px_rgba(168,85,247,0.9),_0_0_50px_rgba(168,85,247,0.7),_0_0_100px_rgba(168,85,247,0.5)]">
                            {tDB(settings?.content?.hero?.title) || t('hero.title')}
                        </h1>

                        {/* כותרת משנה - עם זוהר סגול חזק */}
                        <h2 className="text-2xl md:text-[2.75rem] font-bold text-brand-primary mb-8 tracking-wide [text-shadow:_0_0_15px_rgba(168,85,247,0.9),_0_0_40px_rgba(168,85,247,0.7),_0_0_80px_rgba(168,85,247,0.5)]">
                            {tDB(settings?.content?.hero?.subtitle) || t('hero.subtitle')}
                        </h2>

                        {/* תיאור ארוך - רק אם קיים בדאטהבייס */}
                        {tDB(settings?.content?.hero?.description) && (
                            <p className="text-gray-200 text-base md:text-lg mb-10 max-w-3xl mx-auto leading-relaxed whitespace-pre-line drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                                {tDB(settings?.content?.hero?.description)}
                            </p>
                        )}
                    </>
                )}

                {/* כפתורים */}
                <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-16">
                    <button
                        onClick={() => openBooking()} // פתיחת המודל
                        className="btn-wave-shimmer text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 w-full md:w-auto"
                    >
                        📅 {t('hero.book_btn')}
                    </button>

                    {/* כפתור טריילר (אם יש לינק בהגדרות - יפתח אותו, אחרת כפתור דמי) */}
                    {/* <a
                        href={settings?.media?.trailerUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold text-lg border border-white/20 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
                    >
                        <Play size={20} fill="currentColor" /> {t('hero.trailer_btn')}
                    </a> */}

                    <button
                        onClick={() => setIsTrailerOpen(true)}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold text-lg border border-white/20 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
                    >
                        <Play size={20} fill="currentColor" /> {t('hero.trailer_btn')}
                    </button>
                </div>

                {/* Stats Grid - טקסטים מה-JSON */}
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="bg-brand-dark/60 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                        <Users className="text-brand-neon mb-2" size={28} />
                        <span className="text-white font-bold text-xl">2-6</span>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">{t('hero.stats_players')}</span>
                    </div>
                    <div className="bg-brand-dark/60 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                        <Clock className="text-blue-400 mb-2" size={28} />
                        <span className="text-white font-bold text-xl">60</span>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">{t('hero.stats_minutes')}</span>
                    </div>
                    <div className="bg-brand-dark/60 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                        <Zap className="text-yellow-400 mb-2" size={28} />
                        <span className="text-white font-bold text-xl">3</span>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">{t('hero.stats_worlds')}</span>
                    </div>
                </div>
            </div>

            <TrailerModal 
                isOpen={isTrailerOpen} 
                onClose={() => setIsTrailerOpen(false)} 
                videoUrl={settings?.media?.trailerUrl} 
            />
        </div>
    );
};

export default Hero;