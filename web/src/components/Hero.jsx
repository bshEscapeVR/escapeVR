'use client';

import React, { useState } from 'react';
import { Clock, Users, Zap, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // 👈 ייבוא ל-JSON
import { useSettings } from '../context/SettingsContext';
import { useBooking } from '../context/BookingContext'; // 👈 כדי שהכפתור יעבוד
import TrailerModal from './TrailerModal';

const Hero = () => {
    const { t } = useTranslation(); // תרגום סטטי (JSON)
    const { t: tDB, settings, getImg } = useSettings(); // תרגום דינמי (DB)
    const { openBooking } = useBooking();
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

    return (
        <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">

            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={getImg(settings?.media?.heroImage)}
                    alt="VR Background"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/80 via-brand-dark/60 to-brand-dark"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">

                {/* 
                   כותרת ראשית: מגיעה מהדאטה-בייס (ניתנת לעריכה באדמין).
                   אם אין עדיין הגדרה, מציג ברירת מחדל יפה.
                */}
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl">
                    {settings?.content?.hero?.title ? (
                        <span>{tDB(settings.content.hero.title)}</span>
                    ) : (
                        <>BEYOND <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-neon to-blue-400">REALITY</span></>
                    )}
                </h1>

                {/* תת כותרת מהדאטה-בייס */}
                <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                    {tDB(settings?.content?.hero?.subtitle) || "Forget locked cabinets! In Virtual Reality, there are no limits."}
                </p>

                {/* כפתורים */}
                <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-16">
                    <button
                        onClick={() => openBooking()} // פתיחת המודל
                        className="bg-brand-neon hover:bg-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-brand-neon/40 transition-all hover:scale-105 w-full md:w-auto"
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
                    <div className="bg-brand-purple/30 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                        <Users className="text-brand-neon mb-2" size={28} />
                        <span className="text-white font-bold text-xl">2-6</span>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">{t('hero.stats_players')}</span>
                    </div>
                    <div className="bg-brand-purple/30 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                        <Clock className="text-blue-400 mb-2" size={28} />
                        <span className="text-white font-bold text-xl">60</span>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">{t('hero.stats_minutes')}</span>
                    </div>
                    <div className="bg-brand-purple/30 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col items-center">
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