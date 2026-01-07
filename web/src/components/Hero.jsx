'use client';

import React, { useState } from 'react';
import { Clock, Users, Zap, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useBooking } from '../context/BookingContext';
import TrailerModal from './TrailerModal';

const Hero = () => {
    const { t } = useTranslation(); // תרגום סטטי (JSON)
    const { t: tDB, settings, getImg, loading } = useSettings(); // תרגום דינמי (DB)
    const { openBooking } = useBooking();
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

    return (
        <div className="relative min-h-[120vh] pt-20 pb-20 flex items-center justify-center">

            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={getImg(settings?.media?.heroImage)}
                    alt="VR Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-brand-dark/40"></div>
            </div>


            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto -mt-8">

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
                        <h1 className="text-[3.25rem] md:text-[5rem] font-bold text-white mb-1 tracking-normal [text-shadow:_0_0_20px_rgba(168,85,247,0.9),_0_0_50px_rgba(168,85,247,0.7),_0_0_100px_rgba(168,85,247,0.5)]">
                            {tDB(settings?.content?.hero?.title) || t('hero.title')}
                        </h1>

                        {/* כותרת משנה - עם זוהר סגול חזק */}
                        <h2 className="text-3xl md:text-5xl font-bold text-brand-primary mb-8 tracking-wide [text-shadow:_0_0_15px_rgba(168,85,247,0.9),_0_0_40px_rgba(168,85,247,0.7),_0_0_80px_rgba(168,85,247,0.5)]">
                            {tDB(settings?.content?.hero?.subtitle) || t('hero.subtitle')}
                        </h2>

                        {/* תיאור ארוך - רק אם קיים בדאטהבייס */}
                        {tDB(settings?.content?.hero?.description) && (
                            <p className="text-gray-200 text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed whitespace-pre-line drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                                {tDB(settings?.content?.hero?.description)}
                            </p>
                        )}
                    </>
                )}

                {/* כפתורים */}
                <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-16">
                    <button
                        onClick={() => openBooking()}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold text-lg border border-white/30 transition-all hover:scale-105 flex items-center gap-2 w-full md:w-auto justify-center"
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
                    <div className="bg-black/50 backdrop-blur-sm p-4 rounded-2xl border border-brand-primary/30 flex flex-col items-center hover:border-brand-primary/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all">
                        <Users className="text-brand-neon mb-2" size={28} />
                        <span className="text-white font-bold text-xl">2-6</span>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">{t('hero.stats_players')}</span>
                    </div>
                    <div className="bg-black/50 backdrop-blur-sm p-4 rounded-2xl border border-brand-primary/30 flex flex-col items-center hover:border-brand-primary/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all">
                        <Clock className="text-blue-400 mb-2" size={28} />
                        <span className="text-white font-bold text-xl">60</span>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">{t('hero.stats_minutes')}</span>
                    </div>
                    <div className="bg-black/50 backdrop-blur-sm p-4 rounded-2xl border border-brand-primary/30 flex flex-col items-center hover:border-brand-primary/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all">
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